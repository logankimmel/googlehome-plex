
process.env.DEBUG = 'actions-on-google:*';

const ActionsSdkAssistant = require('actions-on-google').ActionsSdkAssistant;
const PlexAPI = require("plex-api");

exports.plexInfo = (req, res) => {
  const assistant = new ActionsSdkAssistant({request: req, response: res});
  var fs = require('fs');
  var parseJson = require('parse-json');
  var opts = parseJson(fs.readFileSync('creds.json'));

  const client = new PlexAPI(opts);

  function mainIntent (assistant) {
    console.log('mainIntent');
    let inputPrompt = assistant.buildInputPrompt(true, '<speak>Hello from Plex! ' +
          'You can say either, <break time="1"/> "name", <break time="1"/> ' +
          '"recently added" <break time="1"/> , ' +
          '"on deck" <break time="1"/>, ' +
          '"refresh movies" <break time="1"/>, ' +
          '<break time="1"/> or "random movie". ' +
          'What would you like?</speak>',
          ['I didn\'t hear that', 'If you\'re still there, what would you like to know?']);
    assistant.ask(inputPrompt);
  }

  function rawInput (assistant) {
    let raw = assistant.getRawInput().toLowerCase();
    console.log('rawInput: ' + raw);

    if (raw === 'goodbye') {
      assistant.tell('Goodbye!');
    } else {
      switch(raw) {
        case 'name':

          client.query("/").then(function (result) {
            var mc =  result.MediaContainer;
            inputString = "<speak> Your Plex Server name is " + mc.friendlyName + "</speak>";
            let inputPrompt = assistant.buildInputPrompt(true, inputString,
                ['I didn\'t hear that', 'If you\'re still there, what would you like to know?']);
            assistant.ask(inputPrompt);
          }, function (err) {
            console.error("Could not connect to server", err);
          });
          break;

        case 'recently added':
          client.query("/library/recentlyAdded").then(function (result) {
            var md = result.MediaContainer.Metadata;
            inputString = "<speak> Most recent plex items are"
            console.log("MD: %s", md)
            for(var i in md) {
              if (i == 4) {
                break;
              }
              var item = md[i];
              if (item.type == "season") {
                var lineString = item.parentTitle + ", " + item.title + ", Episode " + item.leafCount;
              } else {
                var lineString = "The movie, " + item.title;
              }
              inputString += ". " + lineString;
            }
            inputString += ". </speak>";
            let inputPrompt = assistant.buildInputPrompt(true, inputString,
                ['I didn\'t hear that', 'If you\'re still there, what would you like to know?']);
            assistant.ask(inputPrompt);
          }, function (err) {
            console.error("Could not connect to server", err);
          });
          break;

        case 'on deck':
          client.query("/library/onDeck").then(function (result) {
            inputString = '<speak> The items on deck are, <break time="1"/> '
            var od = result.MediaContainer.Metadata;
            for (var o in od) {
              inputString += od[o].title + ', <break time"1"/> ';
            }
            inputString += ". </speak>";
            let inputPrompt = assistant.buildInputPrompt(true, inputString,
              ['I didn\'t hear that', 'If you\'re still there, what would you like to know?']);
            assistant.ask(inputPrompt);
        }, function (err) {
          console.error("Could not connect to server", err);
        });
        break;

        case 'random movie':
          client.query("/library/sections/1/all").then(function (res) {
            var totalMovies = res.MediaContainer.size;
            console.log("Total movies: %s", totalMovies)
            var random = Math.floor(Math.random() * totalMovies) + 0;
            var movie = res.MediaContainer.Metadata[random];
            var inputString = 'Your random movie is <break time="1"/> ' + movie.title;
            let inputPrompt = assistant.buildInputPrompt(true, inputString,
                ['I didn\'t hear that', 'If you\'re still there, what would you like to know?']);
            assistant.ask(inputPrompt);
          }, function (err) {
            console.error("Error calling to server", err);
          });
          break;

        case 'refresh movies':
        client.perform("/library/sections/1/refresh").then(function (res) {
          let inputPrompt = assistant.buildInputPrompt(true, "Successfully started refresh of movie library.",
            ['I didn\'t hear that', 'If you\'re still there, what would you like to know?']);
          assistant.ask(inputPrompt);
        }, function (err) {
          console.error("Error refreshing movies", err);
        });
        break;

        default:
          var inputString = 'I\'m sorry, I don\'t know that information';
          let inputPrompt = assistant.buildInputPrompt(true, inputString,
              ['I didn\'t hear that', 'If you\'re still there, what would you like to know?']);
          assistant.ask(inputPrompt);
      }
    }

  }

  function query(api, options) {
    return api.postQuery(options).then(function(response) {
        return response;
    })
  }

  let actionMap = new Map();
  actionMap.set(assistant.StandardIntents.MAIN, mainIntent);
  actionMap.set(assistant.StandardIntents.TEXT, rawInput);

  assistant.handleRequest(actionMap);
};
