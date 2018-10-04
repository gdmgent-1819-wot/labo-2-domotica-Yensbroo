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
red = (255, 0, 0)
yellow = (255, 255, 0)
dark_yellow = (204, 204, 0)
dark_blue = (0, 0, 153)

room_matrix = [
    0, 0, 1, 0, 0, 1, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    2, 0, 0, 0, 0, 0, 0, 2,
    0, 0, 1, 0, 0, 1, 0, 0,
    3, 0, 0, 0, 0, 0, 0, 3,
    3, 0, 0, 0, 0, 0, 0, 3,
    3, 0, 0, 2, 2, 0, 0, 3
]

room_alarm = [
    0, 0, 7, 0, 0, 7, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    7, 0, 0, 0, 0, 0, 0, 7,
    0, 0, 7, 0, 0, 7, 0, 0,
    7, 0, 0, 0, 0, 0, 0, 7,
    7, 0, 0, 0, 0, 0, 0, 7,
    7, 0, 0, 7, 7, 0, 0, 7
]

TEMP_CORRECTION_FACTOR = 1.5

serviceAccountKey = "../keys/serviceAccountKey.json"
databaseURL = "https://domotica-205ee.firebaseio.com/"

try:
    firebase_cred = credentials.Certificate(serviceAccountKey)

    firebase_admin.initialize_app(firebase_cred, {
        "databaseURL": databaseURL
    })
    print('firebase initialized')

    firebase_ref_pi_domotica = db.reference("room")

except:
    print('Unable to initialize Firebase: {}'.format(sys.exc_info()[0]))
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


def generate_room(state):
    matrix = []
    color = None
    for p in range(0, 64):
        bit = state[p]
        if bit == 0:
            color = black
        elif bit == 1:
            color = yellow
        elif bit == 2:
            color = blue
        elif bit == 3:
            color = green
        elif bit == 7:
            color = red
        elif bit == 5:
            color = dark_yellow
        elif bit == 6:
            color = dark_blue
        matrix.append(color)
    return(matrix)

def check_alarm(): 
  current_alarm = firebase_ref_pi_domotica.child('alarm').get()

  if current_alarm is None:
    firebase_ref_pi_domotica.child('alarm').set(False)
  elif current_alarm:
    for i in range(0, 15):
      alarm_on = generate_room(room_alarm)
      sense_hat.set_pixels(alarm_on)
      sleep(1)
      alarm_off = generate_room(room_matrix)
      sense_hat.set_pixels(alarm_off)
      sleep(1)
      firebase_ref_pi_domotica.child('alarm').set(False)

def get_current_room_state():
    current_state = firebase_ref_pi_domotica.child('room_1').get()
    state = []
    if current_state is not None: 
        # convert value string to array
        val_arr = list(current_state)

        # convert every string in list to integer
        bit_list = list(map(int, val_arr))
        room_state = generate_room(bit_list)
        sense_hat.set_pixels(room_state)
    else:
        current_room = generate_room(room_matrix)
        room_string = ''.join(str(e) for e in room_matrix)
        sense_hat.set_pixels(current_room)
        firebase_ref_pi_domotica.child('room_1').set(room_string)


try:
    # SenseHat
    sense_hat = SenseHat()
    sense_hat.set_imu_config(False, False, False)
except:
    print('Unable to initialize the Sense hat library: {}'.format(
        sys.exc_info()[0]))
    sys.exit(1)


def main():
    while True:
        # generate_room(room_matrix)
        get_current_room_state()
        temp = round(get_temp(True))
        humidity = round(sense_hat.get_humidity())
        firebase_ref_pi_domotica.child('conditions').set({
        'current_temperature': temp,
        'current_humidity': humidity
        })
        check_alarm()
       
        



if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, SystemExit):
        print('Interrupt received! Stopping the application...')
    finally:
        print('Cleaning up the mess...')
        sys.exit(0)
