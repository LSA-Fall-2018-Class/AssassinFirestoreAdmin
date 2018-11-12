
'use strict';

// Each data field within a player - Only used to pre-build games
const INDEX_PLAYER_ID = 0;
const INDEX_PLAYER_NAME = 1;
const INDEX_PLAYER_STATUS = 2;
const INDEX_PLAYER_TARGET = 3;
const INDEX_PLAYER_PICTURE_NAME = 4;

// Each data field within an admin
const INDEX_ADMIN_ID = 0;
const INDEX_ADMIN_NAME = 1;
const INDEX_ADMIN_STATUS = 2;

// Game status constants
const GAME_STATUS_NOT_STARTED = 0;
const GAME_STATUS_ACTIVE = 1;
const GAME_STATUS_COMPLETED = 2;

// Player status constants
const PLAYER_STATUS_WAITING = 0;
const PLAYER_STATUS_ACTIVE = 1;
const PLAYER_STATUS_INACTIVE = 2;
const PLAYER_STATUS_BREAK = 3;

const ADMIN_STATUS_LOGGED_OUT = 0;
const ADMIN_STATUS_LOGGED_IN = 1;

const ACTIVE_CHAIN_LABEL = "Active Chain: <br>";
const AWAITING_ASSIGNMENT_LABEL = "Awaiting Assignment: <br>";
const INACTIVE_LABEL = "Inactive: <br>";
const ON_BREAK_LABEL = "On Break: <br>";

const EVENT_TYPE_APP_STARTED = 0;
const EVENT_TYPE_START_GAME = 1;
const EVENT_TYPE_LOGIN = 2;
const EVENT_TYPE_INCORRECT_LOGIN = 4;
const EVENT_TYPE_LOGOFF = 5;
const EVENT_TYPE_REACTIVATE = 8;
const EVENT_TYPE_REACTIVATE_FAILED = 9;
const EVENT_TYPE_ADD_PLAYER = 10;
const EVENT_TYPE_ADD_PLAYER_FAILED = 11;
const EVENT_TYPE_BOMB = 13;
const EVENT_TYPE_PAY_BOUNTY = 18;
const EVENT_TYPE_PAY_BOUNTY_FAILED = 19;

const OWED_STARTER = 0; // for testing purposes start with 3 owed so buy back in can be tested

var lastEvent;

// in progress game with closed loop of 4 players
 var presetPlayers = new Array;
 presetPlayers.push(["12345678", "Carlo", PLAYER_STATUS_ACTIVE, "98765432", "carlo pic.jpg"]);
 presetPlayers.push(["98765432", "Joey", PLAYER_STATUS_ACTIVE, "99998888", "joey pic.jpg"]);
 presetPlayers.push(["99998888", "Adlani", PLAYER_STATUS_ACTIVE, "11113333", "adlani pic.jpg"]);
 presetPlayers.push(["11113333", "Jon", PLAYER_STATUS_ACTIVE, "12345678", "jon pic.jpg"]);

 // in progress game with closed loop of 4 players, 2 admins
  var presetAdmins = new Array;
  presetAdmins.push(["123123", "Jon", ADMIN_STATUS_LOGGED_OUT]);
  presetAdmins.push(["222333", "Japhet", ADMIN_STATUS_LOGGED_OUT]);

  // Reports area
  var tempChainMessage = "";
  var tempAwaitingMessage = "";
  var tempInactiveMessage = "";
  var tempOnBreakMessage = "";

// ----- Initialize Firebase -----------------------------------------------------
// Get the config info from the database settings area on your firestore database

var config = {
  apiKey: "AIzaSyBB4kKWj-T1TH59Lyk_gaic5f1ElgLwJLE",
 authDomain: "assassinfirestoretest1.firebaseapp.com",
 databaseURL: "https://assassinfirestoretest1.firebaseio.com",
 projectId: "assassinfirestoretest1",
 storageBucket: "assassinfirestoretest1.appspot.com",
 messagingSenderId: "54139984085"
};

// init firebase
firebase.initializeApp(config);

// create shorthand reference to the database
var db = firebase.firestore();

var storage = firebase.storage();
var storageRef = storage.ref();

// -----  end init firebase ---------------------------------------

// Global data to store user inputted data into form
var id;
var name;
var status = ADMIN_STATUS_LOGGED_OUT;
var target;

// create reference to message board
var message = document.getElementById("messageBoard");
var queueArray = new Array;   // save the queue of ids in waiting queue

// Set game status to "Not Started"  ---------------------------------

db.collection("gameData").doc("gameData").set({
  status: GAME_STATUS_NOT_STARTED
})
.then(function() {
  console.log("Set game status to Not Started");
})
.catch(function(error) {
  console.error("Set game status to Not Started failed", error);
});

lastEvent = EVENT_TYPE_APP_STARTED;
renderGame();



// ----------------------------------------------------------------

function getScreenData()
{
  // Grab data from input boxes and store in global vars
  id = document.getElementById("idInputBox").value;
  name = document.getElementById("nameInputBox").value;
  //status = document.getElementById("statusInputBox").value;
  //target = document.getElementById("targetInputBox").value;

  console.log("Form data: id = " + id + "  Name = " + name + "  status = " + status + "  target = " + target );
}

// -------------------------------------
//  Start all game functions

logInButton.addEventListener('click', function(e)
{
    getScreenData();

    // create a reference to the document
    var adminRef = db.collection("admins").doc(id);

    adminRef.get().then(function(doc)
    {
      if (doc.exists)
      {
          // change status to logged in
          adminRef.update({
            status: ADMIN_STATUS_LOGGED_IN
          })
          .then(function() {
            console.log("Log in admin success. Name is " + presetAdmins[i][INDEX_ADMIN_NAME]);
          })
          .catch(function(error) {
            console.error("Log in admin failed Name is " + presetAdmins[i][INDEX_ADMIN_NAME], error);
          });   // end admin .set

          // display player name in the message board
          message.innerHTML = "Admin success login " + id + "  Name is " + doc.data().name;
      }
      else
      {
        message.innerHTML = "Admin success failed " + id + " not found.";
      }

    }).catch(function(error) {
      console.log("Error getting adminsRef.get() document:", error);
      });

}); // end login button click listener

// Start blankGame function --------------------------------------
// Delete all data

blankGameButton.addEventListener('click', function(e)
{
  // delete players
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

    // delete admins
    var adminsRef = db.collection("admins");
    var query = adminsRef.get().then(snapshot => {
        var batch = db.batch();
        snapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        batch.commit();
      })
      .catch(err => {
        console.log('Error getting or deleting admins documents', err);
      });

    // delete chain
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

      // delete the waiting queue by setting players array to blank
      db.collection("queue").doc("queue").update({
        players: [],
      })
      .then(function() {
        console.log("Queue delete success.");
      })
      .catch(function(error) {
        console.error("Error queue delete.", error);
      });

      // Set game status to "Not Started"  ---------------------------------
      db.collection("gameData").doc("gameData").set({
        status: GAME_STATUS_NOT_STARTED
      })
      .then(function() {
        console.log("Set game status to Not Started");
      })
      .catch(function(error) {
        console.error("Set game status to Not Started failed", error);
      });

});   // end blank game button listener

// Start preBuiltRunningGame function ------------------------------------
// Closed loop of 4 active players, no waiting queue

preBuiltRunningGameButton.addEventListener('click', function(e)
{
  var i;

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

      // add link in the chain
      db.collection("chain").doc(presetPlayers[i][INDEX_PLAYER_ID]).set({
        target: (i == (presetPlayers.length-1)) ? presetPlayers[0][INDEX_PLAYER_ID] : presetPlayers[i+1][INDEX_PLAYER_ID]
      })
      .then(function() {
        console.log("Success writing to chain id is " + presetPlayers[i][INDEX_PLAYER_ID] + " target is " + (i == (presetPlayers.length-1)) ? presetPlayers[0][INDEX_PLAYER_ID] : presetPlayers[i+1][INDEX_PLAYER_ID]);
      })
      .catch(function(error) {
        console.error("Error writing to chain id is " + presetPlayers[i][INDEX_PLAYER_ID], error);
      });

      // zzz - need to add picture in storage - not working - do by hand for now
      //
      // console.log("Gotcha 0");
      // var fullPath = presetPlayers[i][INDEX_PLAYER_ID] + "/" + presetPlayers[i][INDEX_PLAYER_PICTURE_NAME];
      // console.log("Gotcha 1 - full path is " + fullPath);
      //
      // // Create a reference
      // var myFileRef = storageRef.child(fullPath);
      // // var metadata = {
      // //   contentType: 'image/jpeg',
      // // };
      //
      // console.log("Gotcha 2 - file to upload is " + 'images/' + presetPlayers[i][INDEX_PLAYER_PICTURE_NAME]);
      // //var myFile1 = new File(presetPlayers[i][INDEX_PLAYER_PICTURE_NAME]);
      // var prefix = String(presetPlayers[i][INDEX_PLAYER_PICTURE_NAME]).slice(0,(presetPlayers[i][INDEX_PLAYER_PICTURE_NAME].length)-4);
      // alert ("Prefix is " + prefix);
      // var file = new File([prefix],
      //                      presetPlayers[i][INDEX_PLAYER_PICTURE_NAME],
      //                      {type:'image/jpg'});
      // // created object file
      // // console.log(file);
      // console.log("Gotcha 2.5");
      // // Upload file and metadata to the object 'images/mountains.jpg'
      // var uploadTask = myFileRef.put(file);
      // console.log("Gotcha 3");

    } // end for loop

      // Set game status to "Active"  ---------------------------------
      db.collection("gameData").doc("gameData").set({
        status: GAME_STATUS_ACTIVE
      })
      .then(function() {
        console.log("Set game status to Active");
      })
      .catch(function(error) {
        console.error("Set game status to Active failed", error);
      });

      // set admins
      for (i=0;i<presetAdmins.length; i++)
      {
          // add admin to the admins db
          db.collection("admins").doc(presetAdmins[i][INDEX_ADMIN_ID]).set({
            name: presetAdmins[i][INDEX_ADMIN_NAME],
            status: presetAdmins[i][INDEX_ADMIN_STATUS]
          })
          .then(function() {
            console.log("Add admin success. Name is " + presetAdmins[i][INDEX_ADMIN_NAME]);
          })
          .catch(function(error) {
            console.error("Add admin failed Name is " + presetAdmins[i][INDEX_ADMIN_NAME], error);
          });

        } // end for loop

});   // End preBuiltRunningGame button listener -------------------------------

// start preBuiltPlayersWaitingGame function -------------------------
// Only load players into waiting queue

preBuiltPlayersWaitingGameButton.addEventListener('click', function(e)
{
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
      pictureName: ""
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
  db.collection("queue").doc("queue").set({
      players: tempList
    })
    .then(function() {
      console.log("db setting waiting queue players array success");
    })
    .catch(function(error) {
      console.error("db setting waiting queue players array failed", error);
    });

    // set admins
    for (i=0;i<presetAdmins.length; i++)
    {
        // add admin to the admins db
        db.collection("admins").doc(presetAdmins[i][INDEX_ADMIN_ID]).set({
          name: presetAdmins[i][INDEX_ADMIN_NAME],
          status: presetAdmins[i][INDEX_ADMIN_STATUS]
        })
        .then(function() {
          console.log("Add admin success. Name is " + presetAdmins[i][INDEX_ADMIN_NAME]);
        })
        .catch(function(error) {
          console.error("Add admin failed Name is " + presetAdmins[i][INDEX_ADMIN_NAME], error);
        });

      } // end for loop

}); // end preBuiltPlayersWaitingGame button listener -------------------------

// Start startGame function ----------------------

// aaa - .addEventListener('click', function(e)
startGameButton.addEventListener('click', function(e)
{
  console.log("Start game function start");

  // get the waiting queue
  var queueRef = db.collection("queue").doc("queue");

  queueRef.get().then(function(doc)
  {
    if (doc.exists)
    {
        console.log("Doc exists");
        // display players array in the message board
        message.innerHTML = "Players queue is " + doc.data().players;

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

          // delete the waiting queue - looks like this worked
          db.collection("queue").doc("queue").update({
            players: [],
          })
          .then(function() {
            console.log("Queue delete success.");
          })
          .catch(function(error) {
            console.error("Error queue delete.", error);
          });

    }
    else {
      console.log("Doc does not exist.");
    }
  }).catch(function(error) {
    console.log("Error getting queue document:", error);
    });

  // Set game status to "Active"  ---------------------------------
  db.collection("gameData").doc("gameData").set({
    status: GAME_STATUS_ACTIVE
  })
  .then(function() {
    console.log("Set game status to Active");
  })
  .catch(function(error) {
    console.error("Set game status to Active failed", error);
  });

  console.log("Last part of start game function -----------------");

});   // end start game button listener

// Start addPlayer function ---------------------------------------

addPlayerButton.addEventListener('click', function(e)
{
    console.log ("Start of Add Player ---------------------------");
    getScreenData();

    // add player to the players db --------------------
    db.collection("players").doc(id).set({
      status: PLAYER_STATUS_WAITING,
      owed: OWED_STARTER,
      total: 0,
      name: name
    })
    .then(function() {
      console.log("Add player success. ID = " + id + " Name is " + name);
    })
    .catch(function(error) {
      console.error("Add player failed.", error);
    });

    // add player to the waiting queue -------------
    // First get queue, then push new player, then write to db

    var tempQueue = new Array;

    console.log("About to check DB for waiting queue --------------");

    // get the waiting queue
    var queueRef = db.collection("queue").doc("queue");
    queueRef.get().then(function(doc)
    {
      if (doc.exists)
      {
          //console.log("Doc exists");
          // display players array in the message board
          // message.innerHTML = "Players queue is " + doc.data().players;

          tempQueue = doc.data().players; // save queue locally
          console.log("Queue from db is " + doc.data().players);
          console.log("Local Queue inside is " + tempQueue);

          // add new player to local queue
          tempQueue.push(id);

          console.log("Local Queue outside 2 is " + tempQueue);

          // update db queue with local queue
          db.collection("queue").doc("queue").set({
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
        console.log("Error Doc doesnt exists");
      }
    }).catch(function(error) {
        console.log("Error getting queue document:", error);
        });

});   // end function add player button listener

// -----------------------------------------------------------

reactivateButton.addEventListener('click', function(e)
{
  getScreenData();

  /// create a reference to the player document
  var playerRef = db.collection("players").doc(id);
  var tempQueue = new Array;

  playerRef.get().then(function(doc)
  {
    if (doc.exists)
    {
        // display player name in the message board
        message.innerHTML = "Player " + id + " found.  Name is " + doc.data().name;

        if (doc.data().status == PLAYER_STATUS_INACTIVE)
        {
          playerRef.update({
            status: PLAYER_STATUS_WAITING
          })
          .then(function() {
            console.log("Players status update success.");
          })
          .catch(function(error) {
            console.error("Error player status update to db.", error);
          });
        } // end if
        else {
          console.log("Player was not inactive, can't reactivate.");
        }

        // put player in queue - create temp array, get current queue and copy to temp array,  add player to temp array, overwrite temp array to db queue
        // get the waiting queue
        var queueRef = db.collection("queue").doc("queue");
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
              db.collection("queue").doc("queue").set({
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
            });

      }
      else {
        console.log("Player ref doc doesn't exist");
      }

  });

});

//  end reactivate button listener ------------------------

payBountiesButton.addEventListener('click', function(e)
{

    getScreenData();

    // create a reference to the document
    var playerRef = db.collection("players").doc(id);

    playerRef.get().then(function(doc)
    {
      if (doc.exists)
      {
        console.log("Player ref exists in pay bounties.  Owed is " + doc.data().owed + "  paying amount is " + Number(document.getElementById("payBountiesNumber").value));
          // update payers bounties - subtract number entered by admin
          playerRef.update({
            owed: doc.data().owed - Number(document.getElementById("payBountiesNumber").value)
          })
          .then(function() {
            console.log("Players update success owed.");
          })
          .catch(function(error) {
            console.error("Error player update to db owed.", error);
          });

      } // player doc exists
      else {
        console.log("Player doc doesnt exist owed");
      }

    }).catch(function(error) {
      console.log("Error getting playerRef.get() document owed :", error);
      });

});

// ------------------------------------------------------------------------

bombButton.addEventListener('click', function (e)
{
    console.log("Bomb called");
    var tempChain = new Array;
    var i;

    // loop through chain, building temp chain
    var chainRef = db.collection("chain");
    var query = chainRef.get().then(snapshot =>
    {
        snapshot.forEach(doc => {
            console.log("Looping through chain in bomb - " + doc.id + " building temp array ");
            tempChain.push(doc.id);
        });

        console.log("Now getting queue in bomb");

        // get queue add to temp chain
        var queueRef = db.collection("queue").doc("queue");
        queueRef.get().then(function(doc)
        {
            if (doc.exists) // waiting queue doc exists
            {
                console.log("Waiting queue Doc exists - bomb");
                for (i=0; i<doc.data().players.length; i++)
                {
                    console.log("Getting queue players in bomb");
                    tempChain.push(doc.data().players[i]);

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

                // shuffle players in tempChain
                for (i=0;i<((tempChain.length)*50);i++)
                {
                    console.log("Shuffling tempChain - bomb");
                    var index1 = Math.floor((Math.random() * tempChain.length));
                    var index2 = Math.floor((Math.random() * tempChain.length));
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
                } // end for loop

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

            } // end if waiting queue exists

        }); // end queRef.get

    }); // end chainRef.get

}); // end bomb button listener

// End Real Features section functions -------------------------------------------

// -------------------------------------------------

buildReportButton.addEventListener('click', function(e)
{
    var i;
    tempChainMessage = "";
    tempAwaitingMessage = "";
    tempInactiveMessage = "";
    tempOnBreakMessage = "";

    document.getElementById("activeChain").innerHTML = "";
    document.getElementById("awaitingAssignment").innerHTML = "";
    document.getElementById("inactive").innerHTML = "";
    document.getElementById("onBreak").innerHTML = "";

    console.log("Got into buildAndShowQueues");

    // loop through players list, build temp messages for waiting, inactive, and break
    db.collection("players").get().then(function(querySnapshot)
    {

      querySnapshot.forEach(function(doc)
      {
          // doc.data() is never undefined for query doc snapshots
          console.log("Looping through players queue - " + doc.id);

          switch (doc.data().status)
          {
              case PLAYER_STATUS_WAITING:
                tempAwaitingMessage += "Player: " + doc.id + " - Name: " + doc.data().name + ", awaiting assignment.<br>";
              break;

            case PLAYER_STATUS_INACTIVE:
                  tempInactiveMessage += "Player: " + doc.id + " - Name: " + doc.data().name + ", inactive.<br>";
                break;

            case PLAYER_STATUS_BREAK:
                  tempOnBreakMessage += "Player: " + doc.id + " - Name: " + doc.data().name + ", on break.<br>";
                break;

            default:
                console.log("Player status not found - id: " + doc.id + " status is " + doc.data().status);
          }   // end switch

      }); // end query snapshot for each

      // document.getElementById("awaitingAssignment").innerHTML = AWAITING_ASSIGNMENT_LABEL + tempAwaitingMessage;
      // document.getElementById("inactive").innerHTML = INACTIVE_LABEL + tempInactiveMessage;
      // document.getElementById("onBreak").innerHTML = ON_BREAK_LABEL + tempOnBreakMessage;
      //
      // document.getElementById("awaitingAssignment").style.visibility = "visible";
      // document.getElementById("inactive").style.visibility = "visible";
      // document.getElementById("onBreak").style.visibility = "visible";

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

            /// create a reference to the target player document to retrieve name
            var playerRef = db.collection("players").doc(doc.data().target);
            playerRef.get().then(function(doc)
            {
              if (doc.exists)
              {
                  tempChainMessage += "Player " + tempId + " - targeting " + tempTarget + " Name is " + doc.data().name + "<br>";
              }
              else {
                console.log("Player doc doesnt exist inside build reports");
              }
            });

        });

        // document.getElementById("activeChain").innerHTML = ACTIVE_CHAIN_LABEL + tempChainMessage;
        // document.getElementById("activeChain").style.visibility = "visible";

      })
      .catch(err => {
        console.log('Error getting or deleting chain documents', err);
      });

      document.getElementById("activeChain").innerHTML = "Reports Built...";

}); // end function build reports button listener --------------------------------------------

showReportButton.addEventListener('click', function(e)
{
      document.getElementById("activeChain").innerHTML = ACTIVE_CHAIN_LABEL + tempChainMessage;
      document.getElementById("awaitingAssignment").innerHTML = AWAITING_ASSIGNMENT_LABEL + tempAwaitingMessage;
      document.getElementById("inactive").innerHTML = INACTIVE_LABEL + tempInactiveMessage;
      document.getElementById("onBreak").innerHTML = ON_BREAK_LABEL + tempOnBreakMessage;

      document.getElementById("activeChain").style.visibility = "visible";
      document.getElementById("awaitingAssignment").style.visibility = "visible";
      document.getElementById("inactive").style.visibility = "visible";
      document.getElementById("onBreak").style.visibility = "visible";
});

// ----- Start "Add" function ------------------
// use the .add function if you want an autogenerated ID
// use .set if you want to define the id yourself

// Fix This ------- .add?  Should be .set
function addAdmin()
{

  getScreenData();

  db.collection("admins").add({
      id: id,
      name: name
  })
  .then(function(docRef) {
      console.log("admin Document written with ID: ", docRef.id);
  })
  .catch(function(error) {
      console.error("Error adding admin document: ", error);
  });

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

function showAdminDashboard()
{
    // show admin fields
    document.getElementById("reactivateButton").style.visibility = "visible";

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
    document.getElementById("reactivateButton").style.visibility = "hidden";

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




// -------------------------------------   Render Game ------------------------------------------

function renderGame()
{
    // switch (lastEvent)
    // {
    //       case EVENT_TYPE_APP_STARTED:
    //
    //         break;
    //
    //       case EVENT_TYPE_START_GAME:
    //
    //           console.log("Game Started.");
    //           document.getElementById("startGameButton").style.visibility = "hidden";
    //           buildAndShowQueues();  // show all players by status
    //
    //           break;
    //
    //       case EVENT_TYPE_LOGIN:
    //
    //           console.log("Admin mode, logged in successfully.");
    //           document.getElementById("lastMessage").innerHTML = LAST_MESSAGE_TEXT + lastMessage;
    //           document.getElementById("lastMessage").style.visibility = "visible";
    //
    //           hideLoginSection();
    //           // show logoff and Game Start buttons
    //           document.getElementById("logoffButton").style.visibility = "visible";
    //           document.getElementById("startGameButton").style.visibility = "visible";
    //
    //           buildAndShowQueues();  // show all players by status
    //           showAdminDashboard();
    //
    //           break;
    //
    //       case EVENT_TYPE_INCORRECT_LOGIN:
    //
    //           console.log("Logged in unsuccessfully ID is " + document.getElementById("loginID").value);
    //           document.getElementById("lastMessage").innerHTML = LAST_MESSAGE_TEXT + lastMessage;
    //           document.getElementById("loginID").value = "";
    //
    //           break;
    //
    //       case EVENT_TYPE_LOGOFF:
    //
    //           console.log ("Successful logoff.");
    //           document.getElementById("lastMessage").innerHTML = "";
    //           document.getElementById("lastMessage").style.visibility = "hidden";
    //           document.getElementById("logoffButton").style.visibility = "hidden";
    //
    //           hideAdminDashboard();
    //           hidePlayerDashboard();
    //           document.getElementById("returnFromBreakButton").style.visibility = "hidden";
    //           hideProfileData();
    //
    //           showLoginSection();
    //
    //           break;
    //
    //       case EVENT_TYPE_REACTIVATE:
    //
    //           console.log ("Successful reactivate.");
    //           document.getElementById("lastMessage").innerHTML = LAST_MESSAGE_TEXT + lastMessage;
    //
    //
    //           buildAndShowQueues();
    //
    //           break;
    //
    //       case EVENT_TYPE_REACTIVATE_FAILED:
    //
    //           console.log ("Unsuccessful reactivate.");
    //           document.getElementById("lastMessage").innerHTML = LAST_MESSAGE_TEXT + lastMessage;
    //
    //           break;
    //
    //       case EVENT_TYPE_ADD_PLAYER:
    //
    //           console.log ("Successful add player.");
    //           document.getElementById("lastMessage").innerHTML = LAST_MESSAGE_TEXT + lastMessage;
    //
    //           buildAndShowQueues();
    //
    //           break;
    //
    //       case EVENT_TYPE_ADD_PLAYER_FAILED:
    //
    //           console.log ("Unsuccessful add player.");
    //           document.getElementById("lastMessage").innerHTML = LAST_MESSAGE_TEXT + lastMessage;
    //           document.getElementById("newPlayerID").value = "";
    //
    //           break;
    //
    //       case EVENT_TYPE_BOMB:
    //
    //           console.log ("Bomb dropped at " + new Date());
    //           document.getElementById("lastMessage").innerHTML = LAST_MESSAGE_TEXT + lastMessage;
    //           buildAndShowQueues();
    //
    //           break;
    //
    //       case EVENT_TYPE_PAY_BOUNTY:
    //
    //           document.getElementById("lastMessage").innerHTML = LAST_MESSAGE_TEXT + lastMessage;
    //           document.getElementById("payBountiesNumber").value = "";
    //           break;
    //
    //       case EVENT_TYPE_PAY_BOUNTY_FAILED:
    //
    //           document.getElementById("lastMessage").innerHTML = LAST_MESSAGE_TEXT + lastMessage;
    //           document.getElementById("payBountiesNumber").value = "";
    //           break;
    //
    //       default:
    //
    //     } // switch last event
    //
    //   // always blank out admin input fields
    //
    // document.getElementById("newPlayerID").value = "";
    // document.getElementById("newPlayerName").value = "";

} // end function renderGame
