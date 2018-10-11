const app = {
  // server: 'http://52.78.213.9:3000/messages',
  // server: 'http://127.0.0.1:3000/classes/messages',
  server: 'http://localhost:3000/classes/messages',
  // set lobby to user's default room
  userRoom: 'lobby',

  init () {
    $('#send').on('click', this.handleSubmit.bind(this));
    
    $('select#roomSelect').change(() => {
      this.userRoom = $('select#roomSelect').find(':selected').attr('value');
      $('#currentRoomname').html(`${this.userRoom}`)
  
      if (this.userRoom === 'createRoom') {
        $('#newRoomnameField').show()
      } else {
        $('#newRoomnameField').hide()
      }
      this.clearMessages();
      this.fetch()
    });

    this.fetch()
    setTimeout(this.updateRoomname, 2000);

    this.fetchAuto()
  },
  send (userInput) {
    let newUserInput = Object.assign(userInput, {date: Date.now()});

    $.ajax({
      type: 'POST',
      url: this.server,
      contentType: 'application/json',
      data: JSON.stringify(newUserInput),
      success: (data) =>  {
        const messageId = data.id
        // fetch and append to #chats
        this.fetch(messageId)
        // reset currentRoomname
        $('#currentRoomname').html(`${app.userRoom}`)
      },
      error: () => {
        console.log("Error");
      }
    })
  },
  fetch (messageId = null) {
    $.ajax({
      type: 'GET',
      url: this.server,
      contentType: 'application/json',
      success: (data) =>  {
        if (messageId) {
          const message = data.find(m => m.id === messageId)
          this.renderMessage(message)
        } else {
          // has no provided messageId, fetch all by roomname
          //console.log(data)
          let response = JSON.parse(data)
          this.clearMessages()

          response.results.filter(m => { 
            return m.roomname === app.userRoom 
          })
          .forEach(m => {
            this.renderMessage(m)
          }) 
        }
      },
      error: (e) => {
        //console.log('error', e)
      }
    })
  },
  fetchAuto () {
    // use setInterval to fetch messages automatically
    setInterval(() => {
      // disabled temporarily
      this.fetch()

      // toggle icon
      $('#updateStatus').html('<i class="fas fa-check" style="color:green"></i> Refreshed').show()
      setTimeout(() => {
        $('#updateStatus').hide()
      }, 2000)  

    }, 5000)
  },
  clearMessages () {
    $('#chats').empty()
  },
  renderMessage (message) {
    let safeUsername = message.username.replace(/<\/?[^>]+(>|$)/g, "");
    let safeMessage = message.text.replace(/<\/?[^>]+(>|$)/g, "");
    let safeRoomname = message.roomname.replace(/<\/?[^>]+(>|$)/g, "");

    let messageDiv = `
      <div class="card">
        <div class="card-header">
          ${safeUsername} in ${safeRoomname}
        </div>
        <div class="card-body">
          <blockquote class="blockquote mb-0">
            <p>${safeMessage}</p>
            <footer class="blockquote-footer">${moment(message.date).fromNow()}</footer>
          </blockquote>
        </div>
    </div>`;

    // prepend the messageDiv to #chats
    $('#chats').prepend(`<div class='message'>${messageDiv}</div>`);
  },
  renderRoom (roomname) {
    $('#roomSelect').append($('<option>', {
      value: roomname,
      text: 'Create a new room'
    }));
  },
  handleSubmit (event) {
    event.preventDefault();

    // Grab user data from input fields
    const userInput = {};
    userInput.username = $('input#username').val();
    userInput.text = $('textarea#message').val()
    userInput.roomname = $("#roomSelect option:selected").val();
    if (userInput.roomname === "createRoom") {
      userInput.roomname = $('input#newRoomname').val()
    }

    this.userRoom = userInput.roomname

    // reset form inputs
    $("#chatterForm").trigger("reset");

    // POST
    this.send(userInput); 
  },
  updateRoomname () {
    // fetch unique roomnames from the server
    $.ajax({
      type: 'GET',
      url: app.server,
      contentType: 'application/json',
      success: (data) =>  {      
        let roomnames = _.uniq(_.pluck(data, 'roomname'))
        roomnames.splice(roomnames.indexOf('lobby'), 1)
  
        // replace select options with given uniq roomnames
        let selectBox = $('select#roomSelect')

        roomnames.forEach(name => {
          if (name === app.userRoom) {
            selectBox.append(`<option value="${name}" selected>${name}</option>`)
          } else {
            selectBox.append(`<option value="${name}">${name}</option>`)
          }        
        })
      },

      error: () => {
        //console.log("Error");
      }
    })
  }
}

$(document).ready(() => {
  app.init();  
});