(function () {
  const app = {
    init: function () {

      console.log('App initialized');
      // Initialize firebase
      firebase.initializeApp(config)

      // Reference to the Firebase database
      this.database = firebase.database();


      this.roomElement = document.querySelector('.room');
      this.alarmBtn = document.querySelector('.alarm');


      this.makeRoom();
      this.setObjects();
      this.setAlarm();
    },

    getRoomState: function (cb) {
      let room_state;
      this.database.ref().child('room/state').once('value', (snap) => {
        room_state = snap.val();
        cb(room_state)
      })
    },

    setAlarm: function () {
      const self = this
      this.alarmBtn.addEventListener('click', function () {
        self.database.ref().child('room/alarm').set(true);
      })
    },

    makeRoom: function () {
      let i;
      let tempStr = '';
      for (i = 0; i < 64; i++) {
        tempStr += `<div class="bit" data-pos=${i}></div>`
      }
      this.roomElement.innerHTML = tempStr
    },

    setObjects: function (cb) {
      const self = this;
      this.getRoomState((room_state) => {
        let i;
        for (i = 0; i < room_state.length; i++) {
          const bitElement = document.querySelector(`.bit[data-pos="${i}"]`);
          bit = room_state[i]
          if (bit == 'f') {
            bitElement.setAttribute('data-object', 'floor');
          }
          if (bit == 'l') {
            bitElement.setAttribute('data-object', 'light');
          }
          if (bit == 'o') {
            bitElement.setAttribute('data-object', 'outlet');
          }
          if (bit == 'd' && i == 40 || i == 48 || i == 56) {
            bitElement.setAttribute('data-object', 'front_door');
          }
          if (bit == 'd' && i == 47 || i == 55 || i == 63) {
            bitElement.setAttribute('data-object', 'back_door');
          }
          if (bit == 'lo') {
            bitElement.setAttribute('data-object', 'light_out');
          }
          if (bit == 'oo') {
            bitElement.setAttribute('data-object', 'outlet_out');
          }
          if (bit == 'dc') {
            bitElement.setAttribute('data-object', 'door_closed')
          }
          bitElement.addEventListener('click', function () {
            self.addActions(room_state, bitElement, i);
          }, false)
        }
      })
    },

    addActions: function (room_state, bitElement, i) {
      let pattern = room_state;
      const bitObject = bitElement.getAttribute('data-object');
      const frontDoor = document.querySelectorAll('.bit[data-object="front_door"]');
      const frontDoorClosed = document.querySelectorAll('.bit[data-object="front_door_closed"]');
      const backDoor = document.querySelectorAll('.bit[data-object="back_door"]');
      const backDoorClosed = document.querySelectorAll('.bit[data-object="back_door_closed"]');
      const bitPos = bitElement.getAttribute('data-pos');
      if (bitObject == 'light') {
        bitElement.setAttribute('data-object', 'light_out');
        let _pattern = this.replaceString(pattern, bitPos, 1, 'lo');
        pattern = _pattern;
        console.log(pattern);
        this.database.ref('room').child('state').set(pattern);
      }
      if (bitObject == 'light_out') {
        bitElement.setAttribute('data-object', 'light');
        let _pattern = this.replaceString(pattern, bitPos, 1, 'l');
        pattern = _pattern;
        this.database.ref('room').child('state').set(pattern);
      }
      if (bitObject == 'outlet') {
        bitElement.setAttribute('data-object', 'outlet_out');
        let _pattern = this.replaceString(pattern, bitPos, 1, 'oo');
        pattern = _pattern;
        this.database.ref('room').child('state').set(pattern);
      }
      if (bitObject == 'outlet_out') {
        bitElement.setAttribute('data-object', 'outlet');
        let _pattern = this.replaceString(pattern, bitPos, 1, 'o');
        pattern = _pattern;
        this.database.ref('room').child('state').set(pattern);
      }
      if (bitObject == 'front_door' || bitObject == 'back_door') {
        if (bitObject == 'front_door') {
          this.setDoor(frontDoor, 'data-object', 'front_door_closed');
          let _pattern = this.replaceString(pattern, 40, 1, 'dc');
          _pattern = this.replaceString(_pattern, 48, 1, 'dc');
          _pattern = this.replaceString(_pattern, 56, 1, 'dc');
          pattern = _pattern;
          this.database.ref('room').child('state').set(pattern);
        }
        if (bitObject == 'back_door') {
          this.setDoor(backDoor, 'data-object', 'back_door_closed');
          let _pattern = this.replaceString(pattern, 63, 1, 'dc');
          _pattern = this.replaceString(_pattern, 55, 1, 'dc');
          _pattern = this.replaceString(_pattern, 47, 1, 'dc');
          pattern = _pattern;
          this.database.ref('room').child('state').set(pattern);
        }
      }
      if (bitObject == 'front_door_closed' || bitObject == 'back_door_closed') {
        if (bitObject == 'front_door_closed') {
          this.setDoor(frontDoorClosed, 'data-object', 'front_door');
          let _pattern = this.replaceString(pattern, 40, 1, 'd');
          _pattern = this.replaceString(_pattern, 48, 1, 'd');
          _pattern = this.replaceString(_pattern, 56, 1, 'd');
          pattern = _pattern;
          console.log(_pattern);
          this.database.ref('room').child('state').set(pattern);
        }
        if (bitObject == 'back_door_closed') {
          this.setDoor(backDoorClosed, 'data-object', 'back_door');
          let _pattern = this.replaceString(pattern, 63, 1, 'd');
          _pattern = this.replaceString(_pattern, 55, 1, 'd');
          _pattern = this.replaceString(_pattern, 47, 1, 'd');
          pattern = _pattern;
          this.database.ref('room').child('state').set(pattern);
        }
      }

    },

    replaceString: function (pattern, i, d, string) {
      const room_array = pattern
      room_array.splice(i, d, string);

      return (room_array);
    },

    setDoor: function (door, attr, string) {
      for (let i = 0; i < door.length; i++) {
        door[i].setAttribute(attr, string);
      }
    }
  }
  app.init();
})()