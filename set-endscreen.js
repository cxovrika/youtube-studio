const { ArgumentParser } = require('argparse')


// Create parser
const parser = new ArgumentParser({
    description: 'YouTube endscreen setter Argument Parser'
})
parser.add_argument('--sid', {type: 'str', help: 'SID cookie for YouTube Studio'})
parser.add_argument('--hsid', {type: 'str', help: 'HSID cookie for YouTube Studio'})
parser.add_argument('--ssid', {type: 'str', help: 'SSID cookie for YouTube Studio'})
parser.add_argument('--apisid', {type: 'str', help: 'APISID cookie for YouTube Studio'})
parser.add_argument('--sapisid', {type: 'str', help: 'SAPISID cookie for YouTube Studio'})
parser.add_argument('--login-info', {type: 'str', help: 'LOGIN_INFO cookie for YouTube Studio'})
parser.add_argument('--video-id', {type: 'str', help: 'Video id that we want to add endscreen to'})
parser.add_argument('--channel-id', {type: 'str', help: 'YouTube channel id that contains the video'})


// Parse all arguments
args = parser.parse_args()

// Make sure all are set
console.log("Checking passed arguments...")

let allSet = true
for (const [key, value] of Object.entries(args)) {
    if (!value) {
        console.log(`[FATAL] No value found for argument ${key}!`)
        allSet = false
    }
}

if (!allSet) {
    console.log(`[FATAL] Not all arguments were specified!`)
    console.log(parser.format_help())
    process.exit(-1)
}


// Start endscreen setting
const { init, getVideo, setEndScreen, endScreen } = require('./src/youtube-studio-api')

const initialize = async () => {
    return init({
        SID: args.sid,
        HSID: args.hsid,
        SSID: args.ssid,
        APISID: args.apisid,
        SAPISID: args.sapisid,
        LOGIN_INFO: args.login_info,
    })
}

initialize().then(async () => {
    const result = await getVideo(args.video_id)
    const video = result.videos[0]
    return video
}).then(async (video) => {
    // Assuming that endscreen duration is 14 sec
    const videoLengthSec = parseInt(video.lengthSeconds)
    const end_screen_start = (videoLengthSec - 14) * 1000

    // Twitch Seeker specific locations
    const POSITION_TOP_RIGHT = {
        "left": 0.6545,
        "top": 0.1385,
    }

    const POSITION_BOTTOM_RIGHT = {
        "left": 0.6545,
        "top": 0.5202,
    }
    
    return setEndScreen(args.video_id, end_screen_start, [
        { ...endScreen.POSITION_BOTTOM_LEFT,  ...endScreen.TYPE_SUBSCRIBE(args.channel_id), ...endScreen.DELAY(0, 14) }, // subscribe button
        { ...POSITION_TOP_RIGHT,              ...endScreen.TYPE_RECENT_UPLOAD,              ...endScreen.DELAY(0, 14) }, // recent upload
        { ...POSITION_BOTTOM_RIGHT,           ...endScreen.TYPE_BEST_FOR_VIEWERS,           ...endScreen.DELAY(0, 14) }, // best for viewers
    ])
}).then((result) => {
    console.log(JSON.stringify(result, null, 4))
}).catch((err) => {
    console.log(err)
    process.exit(-1)
})
