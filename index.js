'use strict';

// 2 db created so simultaneous testing is possible
const FIRESTORE_DB_1 = 1;
const FIRESTORE_DB_2 = 2;
var firebaseDB = FIRESTORE_DB_1;

// Each data field within a player - Only used to pre-build games
const INDEX_PLAYER_ID = 0;
const INDEX_PLAYER_NAME = 1;
const INDEX_PLAYER_STATUS = 2;
const INDEX_PLAYER_TARGET = 3;
const INDEX_PLAYER_PICTURE_NAME = 4;
const INDEX_PLAYER_BREAK_TIMESTAMP = 5;

// Game status constants
const GAME_STATUS_NOT_STARTED = 0;
const GAME_STATUS_ACTIVE = 1;
const GAME_STATUS_PAUSED = 2;
const GAME_STATUS_COMPLETED = 3;
const GAME_STATUS_UNKNOWN = 4;

const GAME_STATUS_NOT_STARTED_TEXT = "Not Started";
const GAME_STATUS_ACTIVE_TEXT = "Active";
const GAME_STATUS_PAUSED_TEXT = "Game paused, only 1 active player";
const GAME_STATUS_COMPLETED_TEXT = "Completed";
const GAME_STATUS_UNKNOWN_TEXT = "Unknown Status";

// Player status constants
const PLAYER_STATUS_LOGGED_OFF = -1;
const PLAYER_STATUS_WAITING = 0;
const PLAYER_STATUS_ACTIVE = 1;
const PLAYER_STATUS_INACTIVE = 2;
const PLAYER_STATUS_BREAK = 3;
const PLAYER_STATUS_REGISTERED = 4;
const PLAYER_STATUS_SCHEDULED = 5;

const PLAYER_STATUS_LOGGED_OFF_TEXT = "Logged Off";
const PLAYER_STATUS_WAITING_TEXT = "Waiting";
const PLAYER_STATUS_ACTIVE_TEXT = "Active";
const PLAYER_STATUS_INACTIVE_TEXT = "Inactive";
const PLAYER_STATUS_BREAK_TEXT = "On Break";
const PLAYER_STATUS_REGISTERED_TEXT = "Registered";
const PLAYER_STATUS_SCHEDULED_TEXT = "Scheduled";
const PLAYER_STATUS_UNKNOWN_TEXT = "Unknown Status";

const REGISTERED_ASAP = 0;      // waiting queue - enter game as soon as possible
const REGISTERED_SCHEDULED = 1; // scheduled queue - wait to enter game until scheduled start

const ACTIVE_CHAIN_LABEL = "Active Chain: <br>";
const AWAITING_ASSIGNMENT_LABEL = "Awaiting Assignment: <br>";
const INACTIVE_LABEL = "Inactive: <br>";
const ON_BREAK_LABEL = "On Break: <br>";
const REGISTERED_LABEL = "Registered: <br>";
const SCHEDULED_LABEL = "Scheduled: <br>";

const EVENT_TYPE_APP_STARTED = 0;
const EVENT_TYPE_START_GAME = 1;
const EVENT_TYPE_LOGIN = 2;
const EVENT_TYPE_INCORRECT_LOGIN = 4;
const EVENT_TYPE_LOGOFF = 5;
const EVENT_TYPE_ADD_PLAYER = 10;
const EVENT_TYPE_ADD_PLAYER_FAILED = 11;
const EVENT_TYPE_BOMB = 13;
const EVENT_TYPE_PAY_BOUNTY = 18;
const EVENT_TYPE_PAY_BOUNTY_FAILED = 19;

const OWED_STARTER = 0; // initial number of bounties owed.  Can change for testing purposes
const MIN_LENGTH_BREAK_DEFAULT = 2; // number of minutes minimum break length

// message text area
const MESSAGE_TEXT_PLAYER_DOESNT_EXIST = "Error - Player doesn't exist, id = "
const MESSAGE_TEXT_INTRO = "Assassin Admin beta version.  No log in necessary."
const MESSAGE_TEXT_ADD_PLAYER = "Add player success. ID = ";
const MESSAGE_TEXT_INVALID_SCREEN_DATA = "Invalid screen data";
const MESSAGE_TEXT_MOVE_WAITING = "Successfully moved to waiting - Player ";
const MESSAGE_TEXT_PLAYER_NOT_FOUND_INACTIVE = "Player not found in inactive status, id = ";
const MESSAGE_TEXT_INVALID_BOUNTY_DATA = "Invalid bounty data.  Try again.  The number of bounties owed is ";
const MESSAGE_TEXT_BOUNTIES_PAID = "Successful Bounty paid. Bounties remaining: ";
const MESSAGE_TEXT_ERROR_GETTING_PLAYER_REF = "Error getting playerRef.get().  Try again.";
const MESSAGE_TEXT_BOMB_DROPPED = "Bomb Dropped!";
const MESSAGE_TEXT_UPLOAD_PIC_SUCCESS = "Upload Player Picture Success.";
const MESSAGE_TEXT_VIEW_PIC_SUCCESS = "View Player Picture Success.";
const MESSAGE_TEXT_ALREADY_STARTED = "The game has already started.";
const MESSAGE_TEXT_RUNNING_GAME_STARTED = "Successful start of pre-built running game.";
const MESSAGE_TEXT_WAITING_GAME_STARTED = "Successful start of pre-built waiting game.";
const MESSAGE_TEXT_BLANK_GAME = "Successful blank game.";
const MESSAGE_TEXT_INVALID_BOMB = "Bombs can only be dropped if game started.";
const MESSAGE_TEXT_ERROR_NEED_2_PLAYERS_TO_START = "Can't start game without at least 2 players in waiting queue.";
const MESSAGE_TEXT_GAME_STARTED = "Successful Game Start.";
const MESSAGE_TEXT_CANT_PRE_BUILT_PAUSED_GAME = "Prebuilt paused game only available after you click Blank Game.";
const MESSAGE_TEXT_CANT_PRE_BUILT_RUNNING_GAME = "Prebuilt running game only available after you click Blank Game.";
const MESSAGE_TEXT_CANT_PRE_BUILT_WAITING_GAME = "Prebuilt waiting game only available after you click Blank Game.";
const MESSAGE_TEXT_INVALID_STATE_NO_GAME_DATA_DOC = "Invalid state.  No game data doc.";
const MESSAGE_TEXT_PICTURE_NOT_FOUND = "Picture file not found for Player id = ";
const MESSAGE_TEXT_PLAYER_ALREADY_EXISTS = "Error - Player already exists, can't Add.";
const MESSAGE_TEXT_PLAYER_CANT_APPROVE = "Player was not inactive or registered, can't approve, id = ";
const MESSAGE_TEXT_SEARCH_NO_PLAYERS_NAME = "No players found with name = ";
const MESSAGE_TEXT_SEARCH_NO_PLAYERS_ID = "No players found with id = ";
const MESSAGE_TEXT_REMOVED_PLAYER = "Successfully removed player, id = ";
const MESSAGE_TEXT_CANT_START_GAME = "You can't start a game now, status is ";
const MESSAGE_TEXT_GAME_COMPLETED = "The game is over.";
const MESSAGE_TEXT_MUST_CHOOSE_ONE_FILE = "You must choose 1 file.";
var lastEvent;

// in progress game with closed loop of 4 players
 var presetPlayers = new Array;
 presetPlayers.push(["12345678", "Carlo", PLAYER_STATUS_ACTIVE, "98765432", "carlo pic.jpg"]);
 presetPlayers.push(["98765432", "Joey", PLAYER_STATUS_ACTIVE, "99998888", "joey pic.jpg"]);
 presetPlayers.push(["99998888", "Adlani", PLAYER_STATUS_ACTIVE, "11113333", "adlani pic.jpg"]);
 presetPlayers.push(["11113333", "Jon", PLAYER_STATUS_ACTIVE, "44445555", "jon pic.jpg"]);
 presetPlayers.push(["44445555", "Ofer", PLAYER_STATUS_ACTIVE, "12345678", "ofer.jpg"]);

  // Reports area
  var tempChainMessage = "";
  var tempAwaitingMessage = "";
  var tempScheduledMessage = "";
  var tempInactiveMessage = "";
  var tempOnBreakMessage = "";
  var tempRegisteredMessage = "";


// ----- Initialize Firebase -----------------------------------------------------
// Get the config info from the database settings area on your firestore database

var config;

if (firebaseDB == FIRESTORE_DB_1)
{
  config =
  {
      apiKey: "AIzaSyBB4kKWj-T1TH59Lyk_gaic5f1ElgLwJLE",
      authDomain: "assassinfirestoretest1.firebaseapp.com",
      databaseURL: "https://assassinfirestoretest1.firebaseio.com",
      projectId: "assassinfirestoretest1",
      storageBucket: "assassinfirestoretest1.appspot.com",
      messagingSenderId: "54139984085"
  };
}
else
{
  config =
  {
      apiKey: "AIzaSyDV4SiK3fKshX681ZABQ1xEFHX9URz71I0",
      authDomain: "assassintestdb2.firebaseapp.com",
      databaseURL: "https://assassintestdb2.firebaseio.com",
      projectId: "assassintestdb2",
      storageBucket: "assassintestdb2.appspot.com",
      messagingSenderId: "356236457364"
  };
}

// init firebase
firebase.initializeApp(config);

// create shorthand reference to the database areas
var db = firebase.firestore();
var storage = firebase.storage();
var storageRef = storage.ref();

// this command needed to get firestore timestamps instead of system date objects - found it online, works
const settings = {timestampsInSnapshots: true};
db.settings(settings);

// -----  end init firebase ---------------------------------------

// global var to store game status
var status;

// Global data to store user inputted data into form
var id;
var name;
var target;
var regType;    // registration type


// create reference to message board
var message = document.getElementById("messageBoard");
var blankGameClicked = false;  // use var to ensure clean game if using prebuilt functions

// check database for game status and update screen ------------------------------------
// get game status and update field,  create a reference to the document
var gameDataRef = db.collection("gameData").doc("gameData");

var minBreakLength = MIN_LENGTH_BREAK_DEFAULT;
var volunteerNeeded = false;  // used for scheduled starts
var nextScheduledStart = "";
var registrationType; // either asap into waiting or Scheduled

gameDataRef.get().then(function(doc)
{
    if (doc.exists)
    {
        console.log("Game Data exists, status is " + doc.data().status + "  Decoded status is " + decodeGameStatus(doc.data().status));
        // set initial message and data
        status = doc.data().status;
        minBreakLength = doc.data().minBreakLength;
        console.log("Min break length in minutes is " + minBreakLength);

        document.getElementById("gameStatus").innerHTML = decodeGameStatus(status);
        message.innerHTML = MESSAGE_TEXT_INTRO + "  Game status is " + decodeGameStatus(status) + ".";
    }
    else {
      console.log("Invalid state.  No game data doc.");
      message.innerHTML = MESSAGE_TEXT_INVALID_STATE_NO_GAME_DATA_DOC;
    }
}).catch(function(error) {
  console.log("Error getting gameRefData.get() document:", error);
});

// --------------------------------------------------------------------------
// subscribe to change in game status **************  Subscribe *************
gameDataRef.onSnapshot(function(doc)
{
    if (doc.exists)
    {
        // update ui and global var
        document.getElementById("gameStatus").innerHTML = decodeGameStatus(doc.data().status);
        status = doc.data().status;

        // if game is paused, update ui and delete chain
        if (doc.data().status == GAME_STATUS_PAUSED)
        {
            console.log("Paused game subscriber called.");
            message.innerHTML = GAME_STATUS_PAUSED_TEXT;
            status = GAME_STATUS_PAUSED;

            // check if anyone remains in the chain.  If yes, change their player status to waiting
            // loop through chain, should be max 1 in chain
            var chainRef = db.collection("chain");

            var query = chainRef.get().then(snapshot =>
            {
                snapshot.forEach(doc =>
                {
                    console.log("Looping through chain at pause scenario - " + doc.id );

                    // set my player status to waiting
                    db.collection("players").doc(doc.id).update({
                      status: PLAYER_STATUS_WAITING
                    })
                    .then(function() {
                      console.log("Player status set to waiting after game pause.");
                    })
                    .catch(function(error) {
                      console.error("Error Player status set to waiting after game pause.", error);
                    });

                    // set waiting queue to just me
                    var tempList = new Array;
                    tempList.push(doc.id);

                    db.collection("queues").doc("waiting").set({
                        players: tempList
                      })
                      .then(function() {
                        console.log("db setting waiting queue after pause success");
                      })
                      .catch(function(error) {
                        console.error("db setting waiting queue after pause failed", error);
                      });

                }); // end snapshot for each

                // delete chain
                deleteChain();

            });  // end chain get

        } // end if game status is paused

    } // end if doc exists
    else {
      console.log("Invalid state.  No game data doc.  Subscriber called.");
      message.innerHTML = MESSAGE_TEXT_INVALID_STATE_NO_GAME_DATA_DOC;
    }
});
// end subscribe to change in game status **************  Subscribe *************

lastEvent = EVENT_TYPE_APP_STARTED;

// End beginning section global vars, consts, etc...  Functions start below....
// ------------------------------------------------------------------------------

function getScreenData()
{
  // Grab data from input boxes and store in global vars
  id = document.getElementById("idInputBox").value;
  name = document.getElementById("nameInputBox").value;

  var myForm = document.getElementById("registrationTypes");

  if (myForm.registration[0].checked == true)
  {
      regType = REGISTERED_ASAP;
  }
  else
  {
      regType = REGISTERED_SCHEDULED;
  }

  console.log("Form data: id = " + id + "  Name = " + name);
}

// --------------------------------------------------------------------------
//  Start all game functions -

// Start blankGame function --------------------------------------
// Delete all data

blankGameButton.addEventListener('click', function(e)
{
  resetInputBoxes();
  status = GAME_STATUS_NOT_STARTED;
  document.getElementById("gameStatus").innerHTML = decodeGameStatus(GAME_STATUS_NOT_STARTED);
  blankGameClicked = true;

  // delete all players in db
  var playersRef = db.collection("players");
  var query = playersRef.get().then(snapshot => {
      var batch = db.batch();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      batch.commit();
    })
    .catch(err => {
      console.log('Error getting or deleting players documents', err);
    });

    // delete chain and queue
    deleteChain();
    deleteQueue();
    deleteSchedQueue();

    // Set game status to "Not Started"  ---------------------------------
    db.collection("gameData").doc("gameData").update({
      status: GAME_STATUS_NOT_STARTED
    })
    .then(function() {
      console.log("Set game status to Not Started");
    })
    .catch(function(error) {
      console.error("Set game status to Not Started failed", error);
    });

    message.innerHTML = MESSAGE_TEXT_BLANK_GAME;

});   // end blank game button listener  --------------------------------

// Start preBuiltRunningGame function ------------------------------------
// Closed loop of 4 active players, no waiting queue

preBuiltRunningGameButton.addEventListener('click', function(e)
{
  var i; // for loop var

  resetInputBoxes();

  // Only allow after a blank game executed
  if ((status != GAME_STATUS_NOT_STARTED) || (blankGameClicked == false))
  {
    message.innerHTML = MESSAGE_TEXT_CANT_PRE_BUILT_RUNNING_GAME;
    console.log("Prebuilt running game only after blank game.");
    return;
  }

  blankGameClicked = false;

  for (i=0;i<presetPlayers.length; i++)
  {
      // add player to the players db
      db.collection("players").doc(presetPlayers[i][INDEX_PLAYER_ID]).set({
        status: presetPlayers[i][INDEX_PLAYER_STATUS],
        owed: OWED_STARTER,
        total: 0,
        name: presetPlayers[i][INDEX_PLAYER_NAME],
        pictureName: presetPlayers[i][INDEX_PLAYER_PICTURE_NAME]
      })
      .then(function() {
        console.log("Add player success. Name is " + presetPlayers[i][INDEX_PLAYER_NAME]);
      })
      .catch(function(error) {
        console.error("Add player failed Name is " + presetPlayers[i][INDEX_PLAYER_NAME], error);
      });

      // add link in the chain - set my target to the next player unless I'm already at the end, then set to the first player
      db.collection("chain").doc(presetPlayers[i][INDEX_PLAYER_ID]).set({
        target: (i == (presetPlayers.length-1)) ? presetPlayers[0][INDEX_PLAYER_ID] : presetPlayers[i+1][INDEX_PLAYER_ID]
      })
      .then(function() {
        console.log("Success writing to chain id is " + presetPlayers[i][INDEX_PLAYER_ID] + " target is " + (i == (presetPlayers.length-1)) ? presetPlayers[0][INDEX_PLAYER_ID] : presetPlayers[i+1][INDEX_PLAYER_ID]);
      })
      .catch(function(error) {
        console.error("Error writing to chain id is " + presetPlayers[i][INDEX_PLAYER_ID], error);
      });

    }  // end for loop

    // Update game status to "Active"  ---------------------------------
    db.collection("gameData").doc("gameData").update({
      status: GAME_STATUS_ACTIVE
    })
    .then(function() {
      console.log("Set game status to Active");
    })
    .catch(function(error) {
      console.error("Set game status to Active failed", error);
    });

    status = GAME_STATUS_ACTIVE;
    document.getElementById("gameStatus").innerHTML = decodeGameStatus(GAME_STATUS_ACTIVE);
    message.innerHTML = MESSAGE_TEXT_RUNNING_GAME_STARTED;

});   // End preBuiltRunningGame button listener -------------------------------

// start preBuiltPlayersWaitingGame function -------------------------
// Only load players into waiting queue

preBuiltPlayersWaitingGameButton.addEventListener('click', function(e)
{
    resetInputBoxes();

    if ((status != GAME_STATUS_NOT_STARTED) || (blankGameClicked == false))
    {
      message.innerHTML = MESSAGE_TEXT_CANT_PRE_BUILT_WAITING_GAME;
      console.log("Prebuilt waiting game only after blank game.");
      return;
    }

    blankGameClicked = false;

  var tempList = new Array;
  var i;

  for (i=0;i<presetPlayers.length; i++)
  {
    console.log("Adding a prebuilt player to game");
    tempList.push(presetPlayers[i][INDEX_PLAYER_ID]); // pull the id from the players list

    // add player to the players db
    db.collection("players").doc(presetPlayers[i][INDEX_PLAYER_ID]).set({
      status: PLAYER_STATUS_WAITING,
      owed: OWED_STARTER,
      total: 0,
      name: presetPlayers[i][INDEX_PLAYER_NAME],
      pictureName: presetPlayers[i][INDEX_PLAYER_PICTURE_NAME]
    })
    .then(function() {
      console.log("Add player success. Name is " + presetPlayers[i][INDEX_PLAYER_NAME]);
    })
    .catch(function(error) {
      console.error("Add player failed Name is " + presetPlayers[i][INDEX_PLAYER_NAME], error);
    });

  }

  console.log("Updating queue here prebuilt waiting game");
  // update queue
  db.collection("queues").doc("waiting").set({
      players: tempList
  })
  .then(function() {
    console.log("db setting waiting queue players array success");
  })
  .catch(function(error) {
    console.error("db setting waiting queue players array failed", error);
  });

  // waiting
  message.innerHTML = MESSAGE_TEXT_WAITING_GAME_STARTED;

});

// ------- Start paused game scenario, only 2 players each targeting each other

preBuiltPausedGameButton.addEventListener('click', function(e)
{
  var i;

  resetInputBoxes();

  console.log("paused game prebuilt clicked");

  if ((status != GAME_STATUS_NOT_STARTED) || (blankGameClicked == false))
  {
    message.innerHTML = MESSAGE_TEXT_CANT_PRE_BUILT_PAUSED_GAME;
    console.log("Prebuilt paused game only after blank game.");
    return;
  }

  blankGameClicked = false;

  for (i=0;i<2; i++)  // 2 players sets up a paused game, each targets each other is ok
  {
      // add player to the players db
      db.collection("players").doc(presetPlayers[i][INDEX_PLAYER_ID]).set({
        status: presetPlayers[i][INDEX_PLAYER_STATUS],
        owed: OWED_STARTER,
        total: 0,
        name: presetPlayers[i][INDEX_PLAYER_NAME],
        pictureName: presetPlayers[i][INDEX_PLAYER_PICTURE_NAME]
      })
      .then(function() {
        console.log("Add player success. Name is " + presetPlayers[i][INDEX_PLAYER_NAME]);
      })
      .catch(function(error) {
        console.error("Add player failed Name is " + presetPlayers[i][INDEX_PLAYER_NAME], error);
      });

      // add link in the chain
      db.collection("chain").doc(presetPlayers[i][INDEX_PLAYER_ID]).set({
        target: (i == 0) ? presetPlayers[1][INDEX_PLAYER_ID] : presetPlayers[0][INDEX_PLAYER_ID]
      })
      .then(function() {
        console.log("Success writing to chain - paused game");
      })
      .catch(function(error) {
        console.error("Error writing to chain - paused game");
      });

  }  // end for loop

  // Set game status to "Active"  ---------------------------------
  db.collection("gameData").doc("gameData").update({
    status: GAME_STATUS_ACTIVE
  })
  .then(function() {
    console.log("Set game status to Active");
  })
  .catch(function(error) {
    console.error("Set game status to Active failed", error);
  });

  status = GAME_STATUS_ACTIVE;
  document.getElementById("gameStatus").innerHTML = decodeGameStatus(GAME_STATUS_ACTIVE);
  message.innerHTML = MESSAGE_TEXT_RUNNING_GAME_STARTED;

});       // end prebuilt paused game button

// Start startGame function --------------------------------------------------------

startGameButton.addEventListener('click', function(e)
{
  console.log("Start game function called.  Status is " + decodeGameStatus(status));

  resetInputBoxes();

  // Only allow if game not started or paused
  if ((status == GAME_STATUS_NOT_STARTED) || (status == GAME_STATUS_PAUSED))
  {
        // get the waiting queue
        var queueRef = db.collection("queues").doc("waiting");

        queueRef.get().then(function(doc)
        {
          if (doc.exists)
          {
              console.log("Doc exists - length of players queue is " + doc.data().players.length);

              if (doc.data().players.length < 2)
              {
                console.log("Can't start game without at least 2 players in waiting queue");
                message.innerHTML = MESSAGE_TEXT_ERROR_NEED_2_PLAYERS_TO_START;
                return;
              }

              blankGameClicked = false;

              // cycle through players and create links in chain, stop 1 short
              var i;
              for (i=0; i<doc.data().players.length-1;i++)
              {
                  console.log("Iteration " + i + " within create links loop")
                  // create a link in the chain
                  db.collection("chain").doc(doc.data().players[i]).set({
                      target: doc.data().players[i+1]
                    })
                    .then(function() {
                      console.log("Success writing to chain");
                    })
                    .catch(function(error) {
                      console.error("Error writing to chain", error);
                    });

                    // update player status to Active
                    db.collection("players").doc(doc.data().players[i]).update({
                      status: PLAYER_STATUS_ACTIVE
                    })
                    .then(function() {
                      console.log("Players status update success.");
                    })
                    .catch(function(error) {
                      console.error("Error player status update to db.", error);
                    });

              } // end for loop

              // create the last link in the chain
              db.collection("chain").doc(doc.data().players[i]).set({
                  target: doc.data().players[0]
              })
              .then(function() {
                console.log("Success last link");
              })
              .catch(function(error) {
                console.error("Error last link", error);
              });

              // update player status to Active
              db.collection("players").doc(doc.data().players[i]).update({
                status: PLAYER_STATUS_ACTIVE
              })
              .then(function() {
                console.log("Players status update success.");
              })
              .catch(function(error) {
                console.error("Error player status update to db.", error);
              });

              deleteQueue();

              // Set game status to "Active"  ---------------------------------
              db.collection("gameData").doc("gameData").update({
                status: GAME_STATUS_ACTIVE
              })
              .then(function() {
                console.log("Set game status to Active");
              })
              .catch(function(error) {
                console.error("Set game status to Active failed", error);
              });

              status = GAME_STATUS_ACTIVE;
              document.getElementById("gameStatus").innerHTML = decodeGameStatus(GAME_STATUS_ACTIVE);
              message.innerHTML = MESSAGE_TEXT_GAME_STARTED;
              console.log("Last part of start game function -----------------");

          }  // end if queueRef.get doc.exists
          else {
            console.log("Doc does not exist.");
          }
        }).catch(function(error) {
          console.log("Error getting queue document:", error);
          });

  }  // end if game not started
  else
  {
      // game already started
      console.log("Can't start game. Status is " + decodeGameStatus(status));
      message.innerHTML = MESSAGE_TEXT_CANT_START_GAME + decodeGameStatus(status) ;
    }

});   // end start game button listener

// Start end game function -----------------------------------------

endGameButton.addEventListener('click', function(e)
{
  console.log("End game function called");
  resetInputBoxes();

  status = GAME_STATUS_COMPLETED;
  document.getElementById("gameStatus").innerHTML = decodeGameStatus(status);
  message.innerHTML = GAME_STATUS_COMPLETED_TEXT;

  // Set game status to "Completed"  ---------------------------------
  db.collection("gameData").doc("gameData").update({
    status: GAME_STATUS_COMPLETED
  })
  .then(function() {
    console.log("Set game status to Completed.");
  })
  .catch(function(error) {
    console.error("Set game status to Paused failed", error);
  });

  deleteQueue();
  deleteChain();

});

// Start addPlayer function ---------------------------------------

addPlayerButton.addEventListener('click', function(e)
{
    if (status == GAME_STATUS_COMPLETED)
    {
        console.log("Can't add player, game is over.");
        message.innerHTML = MESSAGE_TEXT_GAME_COMPLETED;
        return;
    }

    console.log ("Start of Add Player ---------------------------");
    getScreenData();

    if ((id != "") && (name != ""))
    {
        // check if player already exists - create a reference to the document
        var playerRef = db.collection("players").doc(id);

        playerRef.get().then(function(doc)
        {
            if (doc.exists)
            {
                // player already exists, don't allow
                console.log("Error - Player already exists.");
                message.innerHTML = MESSAGE_TEXT_PLAYER_ALREADY_EXISTS;
                return;
            }

            // add player to the players db --------------------
            db.collection("players").doc(id).set({
              status: (regType == REGISTERED_ASAP) ? PLAYER_STATUS_WAITING : PLAYER_STATUS_SCHEDULED,
              owed: OWED_STARTER,
              total: 0,
              name: name
            })
            .then(function() {
              console.log("Add player success. ID = " + id + " Name is " + name);
              message.innerHTML = MESSAGE_TEXT_ADD_PLAYER + id + " Name is " + name;
            })
            .catch(function(error) {
              console.error("Add player failed.", error);
            });

            // add player to the waiting queue or scheduled queue -------------

            var whichQueue;   // zzzz
            if (regType == PLAYER_STATUS_WAITING)   // add to waiting queue
            {
                whichQueue = "waiting";
                console.log("Which queue set to waiting");
            }
            else
            {
              whichQueue = "scheduled";
              console.log("Which queue set to scheduled");
            }

            // First get queue, then push new player, then write to db
            var tempQueue = new Array;

            // get the waiting or schedule queue and add this player
            var queueRef = db.collection("queues").doc(whichQueue);
            queueRef.get().then(function(doc)
            {
              if (doc.exists)
              {
                  tempQueue = doc.data().players; // save queue locally
                  console.log("Within Add Player - Queue from db is " + doc.data().players);

                  // add new player to local queue
                  tempQueue.push(id);

                  // update db queue with local queue
                  db.collection("queues").doc(whichQueue).set({
                      players: tempQueue
                  })
                  .then(function() {
                    console.log("db setting waiting queue players array success");
                  })
                  .catch(function(error) {
                    console.error("db setting waiting queue players array failed", error);
                  });

              }  // end if doc.exists
              else
              {
                console.log("Error Queue Doc doesn't exist - Add Player");
              }
            }).catch(function(error) {
                console.log("Error getting queue document - Add Player:", error);
            });

          // reset input boxes
          resetInputBoxes();

        }); // player ref get, check if player exists

    }
    else {
      console.log("Invalid screen data - add player button");
      message.innerHTML = MESSAGE_TEXT_INVALID_SCREEN_DATA + " - Add Player.";
    }

});   // end function add player button listener  ---------------------------

// ----------- Start approve button listener -------------------------------

approveButton.addEventListener('click', function(e)
{
    if (status == GAME_STATUS_COMPLETED)
    {
        console.log("Can't approve player, game is over.");
        message.innerHTML = MESSAGE_TEXT_GAME_COMPLETED;
        return;
    }

    getScreenData();

    if (id != "")   // only process if good screen data entered
    {
        /// create a reference to the player document
        var playerRef = db.collection("players").doc(id);

        var tempQueue = new Array;

        playerRef.get().then(function(doc)
        {
            if (doc.exists)
            {
                  // Only approve if inactive or registered
                  if ((doc.data().status == PLAYER_STATUS_INACTIVE) || (doc.data().status == PLAYER_STATUS_REGISTERED))
                  {
                      resetInputBoxes();

                      // set player status to waiting
                      playerRef.update({
                        status: (regType == REGISTERED_ASAP) ? PLAYER_STATUS_WAITING : PLAYER_STATUS_SCHEDULED
                      })
                      .then(function() {
                        console.log("Players status update success.  " + id + " moved from inactive or registered to waiting.");
                        // display player name in the message board
                        message.innerHTML = MESSAGE_TEXT_MOVE_WAITING + id;
                      })
                      .catch(function(error) {
                        console.error("Error player status update to db.", error);
                      });
                  } // end if
                  else
                  {
                    console.log("Player was not inactive or registered, can't approve.");
                    message.innerHTML = MESSAGE_TEXT_PLAYER_CANT_ATIVATE + id;
                    return;
                  }

                  var whichQueue = (regType == REGISTERED_ASAP) ? "waiting" : "scheduled";

                  // put player in queue - create temp array, get current queue and copy to temp array,  add player to temp array, overwrite temp array to db queue
                  // get the waiting queue
                  var queueRef = db.collection("queues").doc(whichQueue);
                  queueRef.get().then(function(doc)
                  {
                    if (doc.exists)
                    {
                        tempQueue = doc.data().players; // save queue locally
                        console.log("Queue from db is " + doc.data().players);
                        console.log("Local Queue inside is " + tempQueue);

                        // add new player to local queue
                        tempQueue.push(id);

                        console.log("Local Queue outside 2 is " + tempQueue);

                        // update db queue with local queue
                        db.collection("queues").doc(whichQueue).set({
                            players: tempQueue
                          })
                          .then(function() {
                            console.log("db setting waiting queue players array success");
                          })
                          .catch(function(error) {
                            console.error("db setting waiting queue players array failed", error);
                          });

                    } else
                    {
                      console.log("Error queue Doc doesnt exists");
                    }
                  }).catch(function(error) {
                      console.log("Error getting queue document:", error);
                  });  // end queue.Ref .get

            }   // end if doc.exists for player ref
            else
            {
                console.log("Player id = " + id + "not found");
                message.innerHTML = MESSAGE_TEXT_PLAYER_DOESNT_EXIST + id;
            }
        }); // end player ref .get

    }   // end if id not blank
    else
    {
        console.log("Invalid screen data - approve player");
        message.innerHTML = MESSAGE_TEXT_INVALID_SCREEN_DATA + " - Approve Player." ;
    }

});  // end approve button listener

// ----------- Start approve all button listener  ------------------------

approveAllButton.addEventListener('click', function(e)
{
  if (status == GAME_STATUS_COMPLETED)
  {
      console.log("Can't approve all, game is over.");
      message.innerHTML = MESSAGE_TEXT_GAME_COMPLETED;
      return;
  }

  // query players db for registered status
  // var tempPlayersRef = db.collection("players");
  var query = db.collection("players").where("status", "==", PLAYER_STATUS_REGISTERED);

  query.get().then(function(querySnapshot)
  {
      var tempQueue = new Array;

      // get current queue and copy to temp queue
      // get the waiting queue
      var queueRef = db.collection("queues").doc("waiting");
      queueRef.get().then(function(doc)
      {
        if (doc.exists)
        {
            tempQueue = doc.data().players; // save queue locally

            querySnapshot.forEach(function(doc)
            {
                // doc.data() is never undefined for query doc snapshots
                console.log("Looping through registered players, moving to waiting - " + doc.id + " Status is " + doc.data().status);
                tempQueue.push(doc.id);

                var playerRef = db.collection("players").doc(doc.id);

                playerRef.update({
                  status: PLAYER_STATUS_WAITING
                })
                .then(function() {
                  console.log("Players status update success.  " + doc.id + " moved from registered to waiting.");
                  // display player name in the message board
                  message.innerHTML = MESSAGE_TEXT_MOVE_WAITING + doc.id;
                })
                .catch(function(error) {
                  console.error("Error player status update to db.", error);
                });

            }); // end query snapshot for each registered player

            // write temp queue to db
            // update db queue with local queue
            db.collection("queues").doc("waiting").set({
                players: tempQueue
              })
              .then(function() {
                console.log("db setting waiting queue players array success");
              })
              .catch(function(error) {
                console.error("db setting waiting queue players array failed", error);
              });

        } // end doc exists

      });   // end get on queue

  }); // end query.get

}); // end approve all button listener


//  end approve all button listener ------------------------

// ----------- Begin Volunteer function - scheduled start --------

volunteerButton.addEventListener('click', function(e)
{
      // flip volunteerNeeded in db to true

      // flip field on db to true  ---------------------------------
      db.collection("gameData").doc("gameData").update({
        volunteerNeeded: true
      })
      .then(function() {
        console.log("Set game status to Paused");
      })
      .catch(function(error) {
        console.error("Set game status to Paused failed", error);
      });

});

// end volunteer button listener

payBountiesButton.addEventListener('click', function(e)
{

    getScreenData();
//
// alert(document.getElementById("payBountiesNumber").value == 0);
// alert(document.getElementById("payBountiesNumber").value == "");
// alert(document.getElementById("payBountiesNumber").innerHTML == "");
//

    // check if screen data is valid - id must not be blank, bountied field must not be blank and must be an integer > 0
    if (
        (id == "") ||
        (isNaN(Number(document.getElementById("payBountiesNumber").value)) == true) ||
        (document.getElementById("payBountiesNumber").value <= 0) ||
        (Number.isInteger(Number(document.getElementById("payBountiesNumber").value)) == false)
      )
    {
      console.log("Invalid screen data in pay bounties.");
      message.innerHTML = MESSAGE_TEXT_INVALID_SCREEN_DATA + " - Pay Bounties.";
      return;
    }

    // create a reference to the document
    var playerRef = db.collection("players").doc(id);

    playerRef.get().then(function(doc)
    {
      if (doc.exists)
      {

        // error checking needed here, shouldn't pay more bounties than necessary
          console.log("Player ref exists in pay bounties.  Owed is " + doc.data().owed + "  paying amount is " + Number(document.getElementById("payBountiesNumber").value));
          var tempBounties;

          // check if numbers valid
          if ( Number(document.getElementById("payBountiesNumber").value) > doc.data().owed )
          {
              // bad data
              console.log("Bad bounty data.");
              resetInputBoxes();
              message.innerHTML = MESSAGE_TEXT_INVALID_BOUNTY_DATA + doc.data().owed;
          }
          else
          {
              tempBounties = doc.data().owed - Number(document.getElementById("payBountiesNumber").value);
              resetInputBoxes();

              // good bounty data
              // update payers bounties - subtract number entered by admin
              playerRef.update({
                owed: tempBounties
              })
              .then(function() {
                console.log("Players update success owed.");
                message.innerHTML = MESSAGE_TEXT_BOUNTIES_PAID + tempBounties;
              })
              .catch(function(error) {
                console.error("Error player update to db owed.", error);
              });
          } // end else bounty daeta

      } // player doc exists
      else {
        console.log("Player doc doesnt exist owed.");
        message.innerHTML = MESSAGE_TEXT_PLAYER_DOESNT_EXIST + id;
      }

    }).catch(function(error) {
      console.log("Error getting playerRef.get() document owed :", error);
      message.innerHTML = MESSAGE_TEXT_ERROR_GETTING_PLAYER_REF;
      });

});

// end pay bounties button listener ------------------------------------------------------------------------

checkBountiesButton.addEventListener('click', function(e)
{

    getScreenData();

    // check if screen data is valid - id must not be blank
    if (id == "")
    {
      console.log("Invalid screen data in check bounties.");
      message.innerHTML = MESSAGE_TEXT_INVALID_SCREEN_DATA + " - Check Bounties.";
      return;
    }

    // create a reference to the document
    var playerRef = db.collection("players").doc(id);

    playerRef.get().then(function(doc)
    {
      if (doc.exists)
      {
          console.log("Player ref exists in check bounties.  Owed is " + doc.data().owed);
          message.innerHTML = "Player " + id + " is owed " + doc.data().owed + " bount" + ((doc.data().owed == 1) ? "y." : "ies.");
      } // player doc exists
      else {
        console.log("Player doc doesnt exist owed.");
        message.innerHTML = MESSAGE_TEXT_PLAYER_DOESNT_EXIST + id;
      }

    }).catch(function(error) {
      console.log("Error getting playerRef.get() document owed :", error);
      message.innerHTML = MESSAGE_TEXT_ERROR_GETTING_PLAYER_REF;
      });

});

// end check bounties button listener ------------------------------------------------------------------------

// ------------------------------------------------------------------------

bombButton.addEventListener('click', function (e)
{
    console.log("Bomb called");

    // Only allow bomb if game is active
    if (status == GAME_STATUS_ACTIVE)
    {
        var tempChain = new Array;
        var i;

        resetInputBoxes();

        message.innerHTML = MESSAGE_TEXT_BOMB_DROPPED;

        // loop through chain, building temp chain
        var chainRef = db.collection("chain");
        var query = chainRef.get().then(snapshot =>
        {
            snapshot.forEach(doc => {
                console.log("Looping through chain in bomb - " + doc.id + " building temp array ");
                tempChain.push(doc.id);
            });

            console.log("Now getting queue in bomb");
            var tempQueue = new Array; // save ids in queue so I can update their status after link created - previous error was status flipped first before link created

            // get queue add to temp chain
            var queueRef = db.collection("queues").doc("waiting");
            queueRef.get().then(function(doc)
            {
                if (doc.exists) // waiting queue doc exists
                {
                    console.log("Waiting queue Doc exists - bomb - players length is " + doc.data().players.length);
                    for (i=0; i<doc.data().players.length; i++)
                    {
                        console.log("Getting queue players in bomb");
                        tempChain.push(doc.data().players[i]);
                        tempQueue.push(doc.data().players[i]);
                    } // end for loop

                    deleteQueue();

                    // shuffle players in tempChain
                    for (i=0;i<((tempChain.length)*50);i++)
                    {
                        console.log("Shuffling tempChain - bomb");
                        var index1 = Math.floor((Math.random() * tempChain.length));
                        // console.log("Index 1 is " + index1);
                        var index2 = Math.floor((Math.random() * tempChain.length));
                        // console.log("Index 2 is " + index2);
                        var tempPlayer = tempChain[index1];
                        tempChain[index1] = tempChain[index2];
                        tempChain[index2] = tempPlayer;
                    }

                    // create new chain
                    var chainRef = db.collection("chain");

                    // cycle through tempChain - 1
                    for (i=0; i<tempChain.length-1;i++)
                    {
                        // add link in the chain
                        db.collection("chain").doc(tempChain[i]).set({
                          target: tempChain[i+1]
                        })
                        .then(function() {
                          console.log("Success writing to chain");
                        })
                        .catch(function(error) {
                          console.error("Error writing to chain", error);
                        });

                        var j;
                        // if this player was in the tempQueue, then flip status to active
                        for (j=0; j<tempQueue.length; j++)
                        {
                            if (tempQueue[j] == tempChain[i])
                            {
                              // update player status to Active
                              db.collection("players").doc(tempQueue[j]).update({
                                status: PLAYER_STATUS_ACTIVE
                              })
                              .then(function() {
                                console.log("Players status update success.");
                              })
                              .catch(function(error) {
                                console.error("Error player status update to db.", error);
                              });
                            }
                        } // end for loop through temp q

                    } // end for loop - temp chain

                    // add last link in the chain
                    db.collection("chain").doc(tempChain[i]).set({
                      target: tempChain[0]
                    })
                    .then(function() {
                      console.log("Success writing to chain last link");
                    })
                    .catch(function(error) {
                      console.error("Error writing to chain last link", error);
                    });

                    var j;
                    // if this last player was in the tempQueue, then flip status to active
                    for (j=0; j<tempQueue.length; j++)
                    {
                        if (tempQueue[j] == tempChain[i])
                        {
                          // update player status to Active
                          db.collection("players").doc(tempQueue[j]).update({
                            status: PLAYER_STATUS_ACTIVE
                          })
                          .then(function() {
                            console.log("Players status update success.");
                          })
                          .catch(function(error) {
                            console.error("Error player status update to db.", error);
                          });
                        }   // end if tempqueue

                    } // end for loop temp queue

                } // end if waiting queue exists
                else {
                  // no queue error checking
                }

            }); // end queRef.get

        }); // end chainRef.get

    } // if game status
    else {
      // wrong status
      console.log("Can't drop bomb unless game is active status");
      message.innerHTML = MESSAGE_TEXT_INVALID_BOMB;
    }

}); // end bomb button listener

// ------------------  Pic functions ------------------------

uploadPlayerPictureButton.addEventListener('click', function (e)
{
    getScreenData();

    if (id != "")
    {
        var playerPicFileName;

        var fileChosen = document.getElementById("playerPictureInput");
        var curFiles = fileChosen.files;

        if(curFiles.length === 1)
        {
            console.log("1 file chosen");

            // get player reference to update picture field
            playerPicFileName = curFiles[0].name;   // save file name to temp var

            var playerRef = db.collection("players").doc(id);
            playerRef.get().then(function(doc)
            {
              if (doc.exists)
              {
                    // update player picture name field
                    playerRef.update({
                      pictureName: playerPicFileName
                    })
                    .then(function() {
                      console.log("Players pic name update success");
                    })
                    .catch(function(error) {
                      console.error("Error player pic name update", error);
                    });
              } // end if player doc exists - need error checking

            });

            var fullPath = String(id) + "/" + playerPicFileName;

            // 'images/mountains.jpg'

            // Create a reference
            var myFileRef = storageRef.child(fullPath);
            // var metadata = {
            //   contentType: 'image/jpeg',
            // };

            // Upload file and metadata to the object 'images/mountains.jpg'
            var uploadTask = myFileRef.put(curFiles[0]);

            message.innerHTML = MESSAGE_TEXT_UPLOAD_PIC_SUCCESS;
            document.getElementById("playerPicture").src = "";

            // error check the upload and monitor progress

        } // end if 1 file chosen
        else {
          message.innerHTML = MESSAGE_TEXT_MUST_CHOOSE_ONE_FILE;
          console.log("You must choose 1 file");
        }

        resetInputBoxes();

    } // end if id != ""
    else {
      console.log("Invalid screen data - add player picture.");
      message.innerHTML = MESSAGE_TEXT_INVALID_SCREEN_DATA + " - Add Player Picture.";
    }

});

// ------------------------------------------------------------------

viewPlayerPictureButton.addEventListener('click', function (e)
{
      getScreenData();

      if (id != "")
      {
          // get player ref, retrieve picture name
          var playerRef = db.collection("players").doc(id);
          playerRef.get().then(function(doc)
          {
              if (doc.exists)
              {
                  var playerPictureRef = storageRef.child(String(id) + "/" + doc.data().pictureName);

                  playerPictureRef.getDownloadURL().then(function(url)
                  {
                    console.log("getDownloadURL worked");

                    var playerPic = document.getElementById("playerPicture");
                    playerPic.src = url;

                    message.innerHTML = MESSAGE_TEXT_VIEW_PIC_SUCCESS;

                  }).catch(function(error)
                    {
                      // A full list of error codes is available at
                      // https://firebase.google.com/docs/storage/web/handle-errors
                      switch (error.code)
                      {
                        case 'storage/object-not-found':
                          console.log("File not found");
                          message.innerHTML = MESSAGE_TEXT_PICTURE_NOT_FOUND + id;
                          document.getElementById("playerPicture").src = "";
                          // File doesn't exist
                          break;

                        case 'storage/unauthorized':
                          // User doesn't have permission to access the object
                          console.log("No permissions");
                          break;

                        case 'storage/canceled':
                          console.log("Storage cancelled");
                          // User canceled the upload
                          break;

                        case 'storage/unknown':
                          console.log("Unknown error");
                          // Unknown error occurred, inspect the server response
                          break;
                      // Handle any errors
                    }

                  }

                  );
              }
              else
              {
                // Player doesn't exist
                console.log("Player doesn't exist searching for picture.")
                message.innerHTML = MESSAGE_TEXT_PLAYER_DOESNT_EXIST + id;
                document.getElementById("playerPicture").src = "";
              }

              resetInputBoxes();

          }); // need error checking - end playerRef
      }
      else
      {
        console.log("Invalid screen data - view player picture.");
        message.innerHTML = MESSAGE_TEXT_INVALID_SCREEN_DATA + " - View Player Picture.";
      }

});

// end viewPlayerPicture button
// ---------------------------------------------------------


// ------------------------------------------------
// Begin search player button listener

searchPlayerButton.addEventListener('click', function(e)
{
    getScreenData();
    var tempPlayersRef = db.collection("players");
    var idList = new Array;

    if (name != "")
    {
      // query players db for registered status
      var query = tempPlayersRef.where("name", "==", name);

      query.get().then(function(querySnapshot)
      {
        if (querySnapshot.size == 0)
        {
          console.log("No players exist with name = " + name);
          message.innerHTML = MESSAGE_TEXT_SEARCH_NO_PLAYERS_NAME + name;
          return;
        }

        querySnapshot.forEach(function(doc)
        {
            // doc.data() is never undefined for query doc snapshots
            console.log("Looping through name matching players - " + doc.id + " Status is " + doc.data().status);
            var tempString = String(doc.id + " Status = " + decodePlayerStatus(doc.data().status));
            console.log("tempString is " + tempString);
            //idList.push(doc.id + " Status = " + decodePlayerStatus(doc.data().status));

            idList.push(tempString);
        }); // end query snapshot for each registered player

        var tempMessage = "Players with name = " + name + " found:<br>";

        var i;
        for (i = 0; i < idList.length; i++)
        {
          tempMessage += idList[i] + "<br>";
        }

        console.log ("End of search button");
        message.innerHTML = tempMessage;

      }); // end query.get

    } // end if name isn't blank
    else if (id != "") // search on id
    {
        var myPlayerRef = db.collection("players").doc(id);
        myPlayerRef.get().then(function(doc)
        {
            if (doc.exists)
            {
                console.log("Player search id = " + id + " exists.");
                message.innerHTML = "Player " + id + " found. Name is " + doc.data().name + ", status is " + decodePlayerStatus(doc.data().status) + ".";
            }
            else
            {
                console.log("No players exist with id = " + id);
                message.innerHTML = MESSAGE_TEXT_SEARCH_NO_PLAYERS_ID + id;
                return;
            }
          });

    }     // end if id isn't blank
    else
    {
      console.log("No data entered for player search.");
      message.innerHTML = MESSAGE_TEXT_INVALID_SCREEN_DATA;
    }

});  // end search player button listener ---------------


// ------------------------------------------------
// Begin Remove player button listener

removePlayerButton.addEventListener('click', function(e)
{
    getScreenData();

    if (id != "")
    {
        var myTargetsID;  // save this for later use

        var playerRef = db.collection("players").doc(id);
        playerRef.get().then(function(doc)
        {
            if (doc.exists)
            {
                switch (doc.data().status)
                {
                  case PLAYER_STATUS_ACTIVE:  // delete chain link, empty queue

                      console.log("In remove player, my status is " + doc.data().status);

                      // get my link, save my targetsId
                      var myLinkRef = db.collection("chain").doc(id);
                      myLinkRef.get().then(function(doc)
                      {
                        if (doc.exists) // Player is active, in the chain
                        {
                            console.log("In remove player, my targets id is " + myTargetsID);
                            myTargetsID = doc.data().target;

                            // Determine which player has me as their target
                            var myAssassinsId;

                            // query db for the document where target = my id
                            var linksRef = db.collection("chain");
                            var query = linksRef.where("target", "==", id);

                            // update chain
                            query.get().then((snapshot) =>
                            {

                                  // console.log("Snapshot size is " + snapshot.size); // + "  Snapshot target data is " + snapshot.docs);
                                  // console.log("Snapshot docs array 0 element id is " + snapshot.docs[0].id); // + "  Snapshot target data is " + snapshot.docs);

                                  // only 1 always
                                  myAssassinsId = snapshot.docs[0].id;

                                  console.log("In remove player, my assassin's id is " + myAssassinsId);

                                  // check here for paused scenario -
                                  // if my target has me as their target, it must be paused
                                  if (myTargetsID == myAssassinsId)
                                  {
                                    // go into paused mode
                                    console.log("Game Paused - Only 1 player active. Found within remove player function.");
                                    message.innerHTML = GAME_STATUS_PAUSED_TEXT;

                                    // Set game status to "Paused"  ---------------------------------
                                    db.collection("gameData").doc("gameData").update({
                                      status: GAME_STATUS_PAUSED
                                    })
                                    .then(function() {
                                      console.log("Set game status to Paused");
                                    })
                                    .catch(function(error) {
                                      console.error("Set game status to Paused failed", error);
                                    });


                                    // delete my link - Maybe move this down
                                    myLinkRef.delete().then(function() {
                                        console.log("my link Quit Game Document successfully deleted!");
                                    }).catch(function(error) {

                                        console.error("my link Quit Game Error removing document: ", error);
                                    });

                                    return;

                                  }

                                  var myAssassinsLinkRef = db.collection("chain").doc(myAssassinsId);

                                  // Check the waiting queue before rebuilding chain - get the waiting queue
                                  var queueRef = db.collection("queues").doc("waiting");
                                  queueRef.get().then(function(doc)
                                  {
                                    console.log("Inside queue ref up front");

                                    if (doc.exists) // waiting queue doc exists
                                    {
                                        console.log("Waiting queue Doc exists");

                                        if (doc.data().players != 0)  // bring in waiting players if queue not empty
                                        {
                                            var i;
                                            var tempArray = new Array;
                                            tempArray = doc.data().players;   // create local array to shuffle players

                                            for (i=0;i<tempArray.length*50;i++)
                                            {
                                              var index1 = Math.floor((Math.random() * doc.data().players.length));
                                              var index2 = Math.floor((Math.random() * doc.data().players.length));
                                              var tempPlayer = tempArray[index1];
                                              tempArray[index1] = tempArray[index2];
                                              tempArray[index2] = tempPlayer;
                                            }

                                            // assign the person that had me to the first person in the queue
                                            myAssassinsLinkRef.update({
                                                  target: tempArray[0]
                                                })
                                                .then(function() {
                                                  console.log("Players update assign my target to first in queue success.");
                                                })
                                                .catch(function(error) {
                                                  console.error("Error assign my target to first in queue.", error);
                                            });

                                            // create the rest of the chain and activate players
                                            var i;
                                            for (i=0; i<tempArray.length-1;i++)
                                            {
                                              console.log("Iteration " + i + " within create links loop within assassination")
                                              // create a link in the chain
                                              db.collection("chain").doc(tempArray[i]).set({
                                                  target: tempArray[i+1]
                                                })
                                                .then(function() {
                                                  console.log("Success writing to chain within assassination");
                                                })
                                                .catch(function(error) {
                                                  console.error("Error writing to chain  within assassination", error);
                                                });

                                                // update player status to Active
                                                db.collection("players").doc(tempArray[i]).update({
                                                  status: PLAYER_STATUS_ACTIVE
                                                })
                                                .then(function() {
                                                  console.log("Players status update success within assassination.");
                                                })
                                                .catch(function(error) {
                                                  console.error("Error player status update to db within assassination.", error);
                                                });

                                            } // end for loop

                                            // assign the target of the last player in the queue to my original target
                                            // create the last link in the chain
                                            db.collection("chain").doc(tempArray[i]).set({
                                                target: myTargetsID
                                              })
                                              .then(function() {
                                                console.log("Success last link within assassination");
                                              })
                                              .catch(function(error) {
                                                console.error("Error last link within assassination", error);
                                              });

                                              // update last player status to Active
                                              db.collection("players").doc(tempArray[i]).update({
                                                status: PLAYER_STATUS_ACTIVE
                                              })
                                              .then(function() {
                                                console.log("Players status update success within assassination.");
                                              })
                                              .catch(function(error) {
                                                console.error("Error player status update to db within assassination.", error);
                                              });

                                              deleteQueue();

                                              // delete my link - Maybe move this down
                                              myLinkRef.delete().then(function() {
                                                  console.log("my link take a break Document successfully deleted!");
                                              }).catch(function(error) {

                                                  console.error("my link take a break Error removing document: ", error);
                                              });

                                        } // end if there are players in the queue
                                        else
                                        {  // queue is empty
                                            console.log("Queue is empty");

                                            // Assign the person that had me to my target (No players waiting)
                                            myAssassinsLinkRef.update({
                                                  target: myTargetsID
                                                })
                                                .then(function() {
                                                  console.log("Players assign the person that had me to my target.");
                                                })
                                                .catch(function(error) {
                                                  console.error("Error assign my target to my targets target's id.", error);
                                            });

                                            // delete my link - Maybe move this down
                                            myLinkRef.delete().then(function() {
                                                console.log("my link take a break Document successfully deleted!");
                                            }).catch(function(error) {

                                                console.error("my link take a break Error removing document: ", error);
                                            });

                                        }   // end else - queue was empty

                                    } // end if queue doc exists
                                    else {
                                      console.log("Queue doc doesn't exist in take a break");
                                    }

                                  });

                            }); // need error checking

                        }
                        else {
                          console.log("My link in chain doesn't exist - Remove Player");
                        }
                      });

                    break;

                  case PLAYER_STATUS_WAITING:

                      // delete from queue

                      // First get queue, loop through, create new queue without player
                      var tempQueue = new Array;

                      // get the waiting queue and remove this player
                      var queueRef = db.collection("queues").doc("waiting");
                      queueRef.get().then(function(doc)
                      {
                        if (doc.exists)
                        {
                            var i;

                            for (i=0;i<doc.data().players.length;i++)
                            {
                                if (doc.data().players[i] != id)
                                  tempQueue.push(id);
                            }

                            // update db queue with local queue
                            db.collection("queues").doc("waiting").set({
                                players: tempQueue
                            })
                            .then(function() {
                              console.log("db setting waiting queue players array success");
                            })
                            .catch(function(error) {
                              console.error("db setting waiting queue players array failed", error);
                            });

                        }  // end if doc.exists
                        else
                        {
                          console.log("Error Queue Doc doesn't exist - Remove Player");
                        }
                      }).catch(function(error) {
                          console.log("Error getting queue document - Remove Player:", error);
                      });

                    break;

                  case PLAYER_STATUS_INACTIVE:
                  case PLAYER_STATUS_BREAK:
                  case PLAYER_STATUS_LOGGED_OFF:
                  case PLAYER_STATUS_REGISTERED:

                    break;

                  default:


                }

                // delete player last ------------------------------------
                db.collection("players").doc(id).delete().then(function()
                {
                  console.log("Player " + id + " successfully deleted!");
                  message.innerHTML = MESSAGE_TEXT_REMOVED_PLAYER + id;
                }).catch(function(error)
                {
                      console.error("Error removing player " + id + " Error: ", error);
                });


            }  // end if doc exists, original player ref
            else {
              console.log("Player doesn't exist on Remove Player call");
              message.innerHTML = MESSAGE_TEXT_PLAYER_NOT_FOUND;
            }


        }); // end player ref.get

    } // end if id not blank
    else {
      console.log("Invalid screen data - remove player button");
      message.innerHTML = MESSAGE_TEXT_INVALID_SCREEN_DATA + " - Remove Player.";
    }

});  // end remove player button listener ---------------

// End Real Features section functions -------------------------------------------
// Start helper function section ------------------------

function deleteQueue()
{
  db.collection("queues").doc("waiting").update({
    players: []
  })
  .then(function() {
    console.log("Queue delete success.");
  })
  .catch(function(error) {
    console.error("Error queue delete.", error);
  });

}

// ---------------------------------------------------------

function deleteSchedQueue()
{
  db.collection("queues").doc("scheduled").update({
    players: []
  })
  .then(function() {
    console.log("Queue sched delete success within assassination.");
  })
  .catch(function(error) {
    console.error("Error sched queue delete within assassination.", error);
  });

}

// ----------------------------------------------------------

function deleteChain()
{
  var chainRef = db.collection("chain");
  var query = chainRef.get().then(snapshot => {
      var batch = db.batch();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      batch.commit();
    })
    .catch(err => {
      console.log('Error getting or deleting chain documents', err);
    });
}  // end function deleteChain


// -------------------------------------------------

buildReportButton.addEventListener('click', function(e)
{
    var i;
    tempChainMessage = "";
    tempAwaitingMessage = "";
    tempScheduledMessage = "";
    tempInactiveMessage = "";
    tempOnBreakMessage = "";
    tempRegisteredMessage = "";

    document.getElementById("activeChain").innerHTML = "";
    document.getElementById("scheduled").innerHTML = "";
    document.getElementById("awaitingAssignment").innerHTML = "";
    document.getElementById("inactive").innerHTML = "";
    document.getElementById("onBreak").innerHTML = "";
    document.getElementById("registered").innerHTML = "";

    console.log("Got into buildAndShowQueues");

    // loop through players list, build temp messages for waiting, inactive, and break
    db.collection("players").get().then(function(querySnapshot)
    {

      querySnapshot.forEach(function(doc)
      {
          // doc.data() is never undefined for query doc snapshots
          console.log("Looping through players queue - " + doc.id + " Status is " + doc.data().status);

          switch (doc.data().status)
          {
              case PLAYER_STATUS_WAITING:
                tempAwaitingMessage += "Player: " + doc.id + " - Name: " + doc.data().name + ", awaiting assignment.<br>";
              break;

              case PLAYER_STATUS_SCHEDULED:
                tempScheduledMessage += "Player: " + doc.id + " - Name: " + doc.data().name + ", scheduled.<br>";
              break;

            case PLAYER_STATUS_INACTIVE:
                  tempInactiveMessage += "Player: " + doc.id + " - Name: " + doc.data().name + ", inactive.<br>";
                break;

            case PLAYER_STATUS_BREAK:
                  tempOnBreakMessage += "Player: " + doc.id + " - Name: " + doc.data().name + ", on break.<br>";
                break;

            case PLAYER_STATUS_REGISTERED:
                  tempRegisteredMessage += "Player: " + doc.id + " - Name: " + doc.data().name + ", registered.<br>";
                break;

            default:
                console.log("Player status NOT waiting, inactive, or on break - id: " + doc.id + " status is " + doc.data().status);
          }   // end switch

      }); // end query snapshot for each

    });  // end players .get

    // get chain and build chain message

    // loop through chain
    var chainRef = db.collection("chain");
    var query = chainRef.get().then(snapshot =>
    {
        snapshot.forEach(doc =>
        {
            console.log("Looping through chain - " + doc.id + " target is " + doc.data().target);

            // create temp target variable
            var tempId = doc.id;
            var tempTarget = doc.data().target;

            // retrieve my name from Players db
            var myPlayerRef = db.collection("players").doc(tempId);
            myPlayerRef.get().then(function(doc)
            {
                if (doc.exists)
                {
                    var tempName = doc.data().name;

                    /// create a reference to the target player document to retrieve name
                    var playerRef = db.collection("players").doc(tempTarget);
                    playerRef.get().then(function(doc)
                    {
                      if (doc.exists)
                      {
                          tempChainMessage += "Player " + tempId + " " + tempName + " - targeting Player " + tempTarget + " " + doc.data().name + "<br>";
                      }
                      else {
                        console.log("Player doc doesnt exist inside build reports");
                      }
                    }); // end playerRef.get function
                  } // end if doc.exists
                  else
                  {
                    // error checking
                  }

            }); // end myPlayerRef.get

        });

      })
      .catch(err => {
        console.log('Error getting or deleting chain documents', err);
      });

      document.getElementById("activeChain").innerHTML = "Reports Built...";

}); // end function build reports button listener --------------------------------------------

// -------------------------------------------------------------

showReportButton.addEventListener('click', function(e)
{
      document.getElementById("activeChain").innerHTML = ACTIVE_CHAIN_LABEL + tempChainMessage;
      document.getElementById("awaitingAssignment").innerHTML = AWAITING_ASSIGNMENT_LABEL + tempAwaitingMessage;
      document.getElementById("inactive").innerHTML = INACTIVE_LABEL + tempInactiveMessage;
      document.getElementById("scheduled").innerHTML = SCHEDULED_LABEL + tempScheduledMessage;

      document.getElementById("onBreak").innerHTML = ON_BREAK_LABEL + tempOnBreakMessage;
      document.getElementById("registered").innerHTML = REGISTERED_LABEL + tempRegisteredMessage;

      document.getElementById("activeChain").style.visibility = "visible";
      document.getElementById("awaitingAssignment").style.visibility = "visible";
      document.getElementById("inactive").style.visibility = "visible";
      document.getElementById("onBreak").style.visibility = "visible";
      document.getElementById("registered").style.visibility = "visible";

});

// start function decodeGameStatus  -------------------------------

function decodeGameStatus(statusPassedIn)
{
  switch (Number(statusPassedIn)) {
    case GAME_STATUS_NOT_STARTED:
      return GAME_STATUS_NOT_STARTED_TEXT;
      break;

    case GAME_STATUS_ACTIVE:
      return GAME_STATUS_ACTIVE_TEXT;
      break;

    case GAME_STATUS_PAUSED:
      return GAME_STATUS_PAUSED_TEXT;
      break;

    case GAME_STATUS_COMPLETED:
      return GAME_STATUS_COMPLETED_TEXT;
      break;

    default:
      return GAME_STATUS_UNKNOWN_TEXT;

  }

} // ----------------------------------------

// start function decodePlayerStatus

function decodePlayerStatus(statusPassedIn)
{
  console.log("decode player status called - status passed in = " + decodeGameStatus(statusPassedIn));

  switch (Number(statusPassedIn)) {

    case PLAYER_STATUS_LOGGED_OFF:
      return PLAYER_STATUS_LOGGED_OFF_TEXT;
      break;

    case PLAYER_STATUS_WAITING:
      return PLAYER_STATUS_WAITING_TEXT;
      break;

    case PLAYER_STATUS_ACTIVE:
      return PLAYER_STATUS_ACTIVE_TEXT;
      break;

    case PLAYER_STATUS_INACTIVE:
      return PLAYER_STATUS_INACTIVE_TEXT;
      break;

    case PLAYER_STATUS_SCHEDULED:
        return PLAYER_STATUS_SCHEDULED;
        break;

    case PLAYER_STATUS_BREAK:
      return PLAYER_STATUS_BREAK_TEXT;
            break;

    case PLAYER_STATUS_REGISTERED:
      return PLAYER_STATUS_REGISTERED_TEXT;
            break;

    default:
      console.log("decode called - default unknown returned.  Status passed in was " + decodeGameStatus(statusPassedIn));
      return PLAYER_STATUS_UNKNOWN_TEXT + decodeGameStatus(statusPassedIn) ;

  }

}

// ---------------------------------------

function showLoginSection()
{
  // Show log in controls
  var loginIDText = document.getElementById("loginIDText");
  loginIDText.style.visibility = "visible";

  var loginID = document.getElementById("loginID");
  loginID.style.visibility = "visible";
  loginID.value = "";

  var loginButton = document.getElementById("loginButton");
  loginButton.style.visibility = "visible";
}

// ------------------------------------------

function hideLoginSection()
{
  // Hide log in controls
  var loginIDText = document.getElementById("loginIDText");
  loginIDText.style.visibility = "hidden";

  var loginID = document.getElementById("loginID");
  loginID.style.visibility = "hidden";
  loginID.value = "";

  var loginButton = document.getElementById("loginButton");
  loginButton.style.visibility = "hidden";
}

// ----------------------------------------------

function resetInputBoxes()
{
  console.log("Reset input boxes called");
  document.getElementById("idInputBox").value = "";
  document.getElementById("nameInputBox").value = "";
  document.getElementById("payBountiesNumber").value = "";
  document.getElementById("playerPictureInput").value = "";
}

// ----------------------------------------------

function showAdminDashboard()
{
    // show admin fields
    document.getElementById("approveButton").style.visibility = "visible";

    document.getElementById("payBountiesNumberText").style.visibility = "visible";
    document.getElementById("payBountiesNumber").style.visibility = "visible";
    document.getElementById("payBountiesButton").style.visibility = "visible";

    document.getElementById("addNewPlayerNameText").style.visibility = "visible";
    document.getElementById("newPlayerID").style.visibility = "visible";
    document.getElementById("addNewPlayerIDText").style.visibility = "visible";
    document.getElementById("newPlayerName").style.visibility = "visible";
    document.getElementById("addNewPlayerButton").style.visibility = "visible";

    document.getElementById("activeChain").style.visibility = "visible";
    document.getElementById("awaitingAssignment").style.visibility = "visible";
    document.getElementById("inactive").style.visibility = "visible";
    document.getElementById("onBreak").style.visibility = "visible";

    document.getElementById("bombButton").style.visibility = "visible";
}

// ---------------------------------------------

function hideAdminDashboard()
{
    // hide admin fields
    document.getElementById("approveButton").style.visibility = "hidden";

    document.getElementById("payBountiesNumberText").style.visibility = "hidden";
    document.getElementById("payBountiesNumber").style.visibility = "hidden";
    document.getElementById("payBountiesButton").style.visibility = "hidden";

    document.getElementById("addNewPlayerNameText").style.visibility = "hidden";
    document.getElementById("newPlayerID").style.visibility = "hidden";
    document.getElementById("addNewPlayerIDText").style.visibility = "hidden";
    document.getElementById("newPlayerName").style.visibility = "hidden";
    document.getElementById("addNewPlayerButton").style.visibility = "hidden";

    document.getElementById("activeChain").style.visibility = "hidden";
    document.getElementById("awaitingAssignment").style.visibility = "hidden";
    document.getElementById("inactive").style.visibility = "hidden";
    document.getElementById("onBreak").style.visibility = "hidden";

    document.getElementById("bombButton").style.visibility = "hidden";
}
