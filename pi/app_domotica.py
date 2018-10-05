import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
from sense_hat import SenseHat
from time import sleep
import os
import sys

black = (0, 0, 0)
green = (0, 255, 0)
blue = (0, 0, 255)
yellow = (255, 255, 0)
red = (255, 0, 0)
orange = (255, 153, 0)
dark_blue = (0, 51, 102)

TEMP_CORRECTION_FACTOR = 1.5

room_state = [
    'f', 'f', 'l', 'f', 'f', 'l', 'f', 'f',
    'f', 'f', 'f', 'f', 'f', 'f', 'f', 'f',
    'f', 'f', 'f', 'f', 'f', 'f', 'f', 'f',
    'o', 'f', 'f', 'f', 'f', 'f', 'f', 'o',
    'f', 'f', 'l', 'f', 'f', 'l', 'f', 'f',
    'd', 'f', 'f', 'f', 'f', 'f', 'f', 'd',
    'd', 'f', 'f', 'f', 'f', 'f', 'f', 'd',
    'd', 'f', 'f', 'o', 'o', 'f', 'f', 'd'
]

room_alarm = [
    'f', 'f', 'dc', 'f', 'f', 'dc', 'f', 'f',
    'f', 'f', 'f', 'f', 'f', 'f', 'f', 'f',
    'f', 'f', 'f', 'f', 'f', 'f', 'f', 'f',
    'dc', 'f', 'f', 'f', 'f', 'f', 'f', 'dc',
    'f', 'f', 'dc', 'f', 'f', 'dc', 'f', 'f',
    'dc', 'f', 'f', 'f', 'f', 'f', 'f', 'dc',
    'dc', 'f', 'f', 'f', 'f', 'f', 'f', 'dc',
    'dc', 'f', 'f', 'dc', 'dc', 'f', 'f', 'dc'
]

serviceAccountKey = "../keys/serviceAccountKey.json"
databaseURL = "https://domotica-205ee.firebaseio.com/"

try:
    firebase_cred = credentials.Certificate(serviceAccountKey)

    firebase_admin.initialize_app(firebase_cred, {
        'databaseURL': databaseURL
    })

    ref = db.reference('room')
except:
    print('Unable to initialize Firebase: {}'.format(sys.exc_info()[0]))
    sys.exit(1)

try:
    sense_hat = SenseHat()
    sense_hat.set_imu_config(False, False, False)
except:
    print('Unable to initialize the Sense hat library: {}'.format(
        sys.exc_info()[0]))
    sys.exit(1)


def get_cpu_temp():
    res = os.popen('vcgencmd measure_temp').readline()
    t = float(res.replace('temp=', '').replace("'C\n", ''))
    return(t)

# use moving average to smooth readings


def get_smooth(x):
    if not hasattr(get_smooth, "t"):
        get_smooth.t = [x, x, x]
    get_smooth.t[2] = get_smooth.t[1]
    get_smooth.t[1] = get_smooth.t[0]
    get_smooth.t[0] = x
    xs = (get_smooth.t[0]+get_smooth.t[1]+get_smooth.t[2])/3
    return(xs)

# get the real temperature


def get_temp(with_case):
    temp_humidity = sense_hat.get_temperature_from_humidity()
    temp_pressure = sense_hat.get_temperature_from_pressure()
    temp = (temp_humidity + temp_pressure)/2
    if with_case:
        temp_cpu = get_cpu_temp()
        temp_corrected = temp - ((temp_cpu - temp)/TEMP_CORRECTION_FACTOR)
        temp_smooth = get_smooth(temp_corrected)
    else:
        temp_smooth = get_smooth(temp)

    return(temp_smooth)


def check_alarm():
    current_alarm = ref.child('alarm').get()

    if current_alarm is None:
        ref.child('alarm').set(False)
    elif current_alarm:
        for i in range(0, 8):
            alarm_on = generate_room(room_alarm)
            sense_hat.set_pixels(alarm_on)
            sleep(1)
            alarm_off = generate_room(room_state)
            sense_hat.set_pixels(alarm_off)
            sleep(1)
            ref.child('alarm').set(False)


def generate_room(matrix):
    room_matrix = []
    color = None
    for b in range(0, 64):
        bit = matrix[b]
        if bit == 'f':
            color = black
        elif bit == 'l':
            color = yellow
        elif bit == 'o':
            color = blue
        elif bit == 'd':
            color = green
        elif bit == 'dc':
            color = red
        elif bit == 'lo':
            color = orange
        elif bit == 'oo':
            color = dark_blue
        room_matrix.append(color)

    return room_matrix


def push_matrix_to_db(matrix):
    ref.child('state').set(matrix)


def get_data_from_db():
    data = ref.child('state').get()
    print(data)

    if data is not None:
        pattern = generate_room(data)
        sense_hat.set_pixels(pattern)
    else:
        pattern = generate_room(room_state)
        sense_hat.set_pixels(pattern)
        push_matrix_to_db(room_state)


def main():
    while True:
        get_data_from_db()
        temp = round(get_temp(True))
        humidity = round(sense_hat.get_humidity())
        ref.child('conditions').set({
            'current_temperature': temp,
            'current_humidity': humidity
        })
        check_alarm()


if __name__ == '__main__':
    try:
        main()
    except(KeyboardInterrupt, SystemExit):
        print('Interrupt received! Stopping the application...')
    finally:
        print('Cleaning up the mess')
        sys.exit(0)
