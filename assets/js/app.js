(function () {
  const app = {
    init: function () {
      firebase.initializeApp(config);


      this.database = firebase.database();

      this.acRows = 8;
      this.acCols = 8;
      this.acWidth = 20;
      this.roomElement = document.querySelector('.room');
      this.alarmBtn = document.querySelector('.alarm');

      this.makeRoomMatrix();
      this.showRoom();
      this.change_state();
      this.setAlarm();
    },

    makeRoomMatrix: function () {
      var tempStr = '',
        top = 0,
        left = 0;

      for (var i = 0; i < this.acRows; i++) {
        for (var j = 0; j < this.acCols; j++) {
          tempStr += `<div class="led led--off" data-row="${i}" data-col="${j}" style="top:${top}px;left:${left}px"></div>`;

          left += this.acWidth;
        }
        top += this.acWidth;
        left = 0;
      }
      this.roomElement.innerHTML = tempStr;

    },

    getRoomState: function (cb) {
      let room_status;
      this.database.ref().child('room/room_1').once('value', (snap) => {

        room_status = snap.val();
        cb(room_status);
      })
    },

    showRoom: function () {
      this.getRoomState((room_status) => {

        for (let i = 0; i < this.acRows; i++) {
          for (let j = 0; j < this.acCols; j++) {
            const bit = room_status.charAt((i * this.acCols) + j);
            const ledElement = this.roomElement.querySelector(`.led[data-row="${i}"][data-col="${j}"]`);
            const colPos = ledElement.getAttribute('data-col');
            const rowPos = ledElement.getAttribute('data-row');
            if (bit == '0') {
              ledElement.setAttribute('data-object', 'floor');
            }
            if (bit == '1' && colPos == "2" && rowPos == "0") {
              ledElement.setAttribute('data-object', 'light_one');
            }
            if (bit == '1' && colPos == "5" && rowPos == "0") {
              ledElement.setAttribute('data-object', 'light_two');
            }
            if (bit == '1' && colPos == "2" && rowPos == "4") {
              ledElement.setAttribute('data-object', 'light_three');
            }
            if (bit == '1' && colPos == "5" && rowPos == "4") {
              ledElement.setAttribute('data-object', 'light_four');
            }
            if (bit == '2' && colPos == "0" && rowPos == "3") {
              ledElement.setAttribute('data-object', 'outlet_one');
            }
            if (bit == '2' && colPos == "7" && rowPos == "3") {
              ledElement.setAttribute('data-object', 'outlet_two');
            }
            if (bit == '2' && colPos == "3" && rowPos == "7") {
              ledElement.setAttribute('data-object', 'outlet_three');
            }
            if (bit == '2' && colPos == "4" && rowPos == "7") {
              ledElement.setAttribute('data-object', 'outlet_four');
            }
            if (bit == '3' && colPos == '0') {
              ledElement.setAttribute('data-object', 'frontDoor');

            }
            if (bit == '3' && colPos == '7') {
              ledElement.setAttribute('data-object', 'backDoor');
            }
            if (bit == '7') {
              ledElement.setAttribute('data-object', 'door_closed');
            }
          }
        }
      })
    },

    replaceAt: function (data, index, dc, rplc) {
      const room_array = data.split('');
      room_array.splice(index, dc, rplc);
      const newStatus = room_array.join("");

      return newStatus;
    },

    setAlarm: function () {
      const self = this
      this.alarmBtn.addEventListener('click', function () {
        self.database.ref().child('room/alarm').set(true);
      })
    },

    change_state: function () {
      const self = this;

      this.getRoomState((room_status) => {
        let _updatedRoom = room_status;
        for (let i = 0; i < this.acRows; i++) {
          for (let j = 0; j < this.acCols; j++) {
            const ledElement = this.roomElement.querySelector(`.led[data-row="${i}"][data-col="${j}"]`);
            const backDoor1 = self.roomElement.querySelector('.led[data-row="5"][data-col="7"]');
            const backDoor2 = self.roomElement.querySelector('.led[data-row="6"][data-col="7"]');
            const backDoor3 = self.roomElement.querySelector('.led[data-row="7"][data-col="7"]');
            const frontDoor1 = self.roomElement.querySelector('.led[data-row="5"][data-col="0"]');
            const frontDoor2 = self.roomElement.querySelector('.led[data-row="6"][data-col="0"]');
            const frontDoor3 = self.roomElement.querySelector('.led[data-row="7"][data-col="0"]');
            ledElement.addEventListener('click', function () {
              const roomObject = ledElement.getAttribute('data-object');
              if (roomObject == 'light_one') {
                const updatedRoom = self.replaceAt(_updatedRoom, 2, 1, "5");
                _updatedRoom = updatedRoom;
                ledElement.setAttribute('data-object', 'light_one_out');
                self.database.ref('room').child('room_1').set(updatedRoom);
              }
              if (roomObject == 'light_one_out') {
                const updatedRoom = self.replaceAt(_updatedRoom, 2, 1, "1");
                _updatedRoom = updatedRoom;
                self.database.ref('room').child('room_1').set(updatedRoom);
                ledElement.setAttribute('data-object', 'light_one');
              }
              if (roomObject == 'light_two') {
                const updatedRoom = self.replaceAt(_updatedRoom, 5, 1, "5");
                _updatedRoom = updatedRoom;
                ledElement.setAttribute('data-object', 'light_two_out');
                self.database.ref('room').child('room_1').set(updatedRoom);
              }
              if (roomObject == 'light_two_out') {
                const updatedRoom = self.replaceAt(_updatedRoom, 5, 1, "1");
                _updatedRoom = updatedRoom;
                self.database.ref('room').child('room_1').set(updatedRoom);
                ledElement.setAttribute('data-object', 'light_two');
              }
              if (roomObject == 'light_three') {
                const updatedRoom = self.replaceAt(_updatedRoom, 34, 1, "5");
                _updatedRoom = updatedRoom;
                ledElement.setAttribute('data-object', 'light_three_out');
                self.database.ref('room').child('room_1').set(updatedRoom);
              }
              if (roomObject == 'light_three_out') {
                const updatedRoom = self.replaceAt(_updatedRoom, 34, 1, "1");
                _updatedRoom = updatedRoom;
                self.database.ref('room').child('room_1').set(updatedRoom);
                ledElement.setAttribute('data-object', 'light_three');
              }
              if (roomObject == 'light_four') {
                const updatedRoom = self.replaceAt(_updatedRoom, 37, 1, "5");
                _updatedRoom = updatedRoom;
                ledElement.setAttribute('data-object', 'light_four_out');
                self.database.ref('room').child('room_1').set(updatedRoom);
              }
              if (roomObject == 'light_four_out') {
                const updatedRoom = self.replaceAt(_updatedRoom, 37, 1, "1");
                _updatedRoom = updatedRoom;
                self.database.ref('room').child('room_1').set(updatedRoom);
                ledElement.setAttribute('data-object', 'light_four');
              }
              if (roomObject == 'outlet_one') {
                const updatedRoom = self.replaceAt(_updatedRoom, 24, 1, "6");
                _updatedRoom = updatedRoom;
                self.database.ref('room').child('room_1').set(updatedRoom);
                ledElement.setAttribute('data-object', 'outlet_one_out')
              }
              if (roomObject == 'outlet_one_out') {
                const updatedRoom = self.replaceAt(_updatedRoom, 24, 1, "2");
                _updatedRoom = updatedRoom;
                self.database.ref('room').child('room_1').set(updatedRoom);
                ledElement.setAttribute('data-object', 'outlet_one')
              }
              if (roomObject == 'outlet_two') {
                const updatedRoom = self.replaceAt(_updatedRoom, 31, 1, "6");
                _updatedRoom = updatedRoom;
                self.database.ref('room').child('room_1').set(updatedRoom);
                ledElement.setAttribute('data-object', 'outlet_two_out')
              }
              if (roomObject == 'outlet_two_out') {
                const updatedRoom = self.replaceAt(_updatedRoom, 31, 1, "2");
                _updatedRoom = updatedRoom;
                self.database.ref('room').child('room_1').set(updatedRoom);
                ledElement.setAttribute('data-object', 'outlet_two')
              }
              if (roomObject == 'outlet_three') {
                const updatedRoom = self.replaceAt(_updatedRoom, 59, 1, "6");
                _updatedRoom = updatedRoom;
                self.database.ref('room').child('room_1').set(updatedRoom);
                ledElement.setAttribute('data-object', 'outlet_three_out')
              }
              if (roomObject == 'outlet_three_out') {
                const updatedRoom = self.replaceAt(_updatedRoom, 59, 1, "2");
                _updatedRoom = updatedRoom;
                self.database.ref('room').child('room_1').set(updatedRoom);
                ledElement.setAttribute('data-object', 'outlet_three')
              }
              if (roomObject == 'outlet_four') {
                const updatedRoom = self.replaceAt(_updatedRoom, 60, 1, "6");
                _updatedRoom = updatedRoom;
                self.database.ref('room').child('room_1').set(updatedRoom);
                ledElement.setAttribute('data-object', 'outlet_four_out')
              }
              if (roomObject == 'outlet_four_out') {
                const updatedRoom = self.replaceAt(_updatedRoom, 60, 1, "2");
                _updatedRoom = updatedRoom;
                self.database.ref('room').child('room_1').set(updatedRoom);
                ledElement.setAttribute('data-object', 'outlet_four')
              }
              if (roomObject == 'backDoor') {

                let updatedRoom = self.replaceAt(_updatedRoom, 47, 1, "7");
                updatedRoom = self.replaceAt(updatedRoom, 55, 1, "7");
                updatedRoom = self.replaceAt(updatedRoom, 63, 1, "7");
                _updatedRoom = updatedRoom;
                self.database.ref('room').child('room_1').set(updatedRoom);
                backDoor1.setAttribute('data-object', 'backDoor_closed');
                backDoor2.setAttribute('data-object', 'backDoor_closed');
                backDoor3.setAttribute('data-object', 'backDoor_closed');
              }
              if (roomObject == 'backDoor_closed') {
                let updatedRoom = self.replaceAt(_updatedRoom, 47, 1, "3");
                updatedRoom = self.replaceAt(updatedRoom, 55, 1, "3");
                updatedRoom = self.replaceAt(updatedRoom, 63, 1, "3");
                _updatedRoom = updatedRoom;
                self.database.ref('room').child('room_1').set(updatedRoom);

                backDoor1.setAttribute('data-object', 'backDoor');
                backDoor2.setAttribute('data-object', 'backDoor');
                backDoor3.setAttribute('data-object', 'backDoor');
              }
              if (roomObject == 'frontDoor') {
                let updatedRoom = self.replaceAt(_updatedRoom, 40, 1, "7");
                updatedRoom = self.replaceAt(updatedRoom, 48, 1, "7");
                updatedRoom = self.replaceAt(updatedRoom, 56, 1, "7");
                _updatedRoom = updatedRoom;
                self.database.ref('room').child('room_1').set(updatedRoom);
                frontDoor1.setAttribute('data-object', 'frontDoor_closed');
                frontDoor2.setAttribute('data-object', 'frontDoor_closed');
                frontDoor3.setAttribute('data-object', 'frontDoor_closed');
              }
              if (roomObject == 'frontDoor_closed') {
                let updatedRoom = self.replaceAt(_updatedRoom, 40, 1, "3");
                updatedRoom = self.replaceAt(updatedRoom, 48, 1, "3");
                updatedRoom = self.replaceAt(updatedRoom, 56, 1, "3");
                _updatedRoom = updatedRoom;
                self.database.ref('room').child('room_1').set(updatedRoom);
                frontDoor1.setAttribute('data-object', 'frontDoor');
                frontDoor2.setAttribute('data-object', 'frontDoor');
                frontDoor3.setAttribute('data-object', 'frontDoor');
              }
            })
          }
        }
      })
    }
  }
  app.init();
})();