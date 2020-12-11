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
    console.log(`Starting polling to make sure vide with id '${args.video_id}' exists on YouTube and is processed...`)

    // Poll until video processing on YouTube side is done
    for (let i = 0; i < 20; i++) {
        console.log(`Trying to get information about video, attempt ${i+1}`)
        try {
            const result = await getVideo(args.video_id)
            const video = result.videos[0]

            if (
                video.responseStatus.statusCode != 'CREATOR_ENTITY_STATUS_FAILURE'
                && video.status == 'VIDEO_STATUS_PROCESSED'
            ) {
                console.log("Got the video, YouTube processing is done!")
                return video
            } else {
                console.log(
                    `Attempt ${i+1} failed, video does not exist or is not yet processed`
                )
            }
        } catch (err) {
            console.log(`Attempt ${i+1} failed with error: ${err}`)
        }
        console.log('sleeping for 1 minute, then trying again...')
        await new Promise(r => setTimeout(r, 1000 * 60))
    }

    console.log("After 20 minutes of polling, could not get the video. Returning non-zero status-code!")
    process.exit(-1)
}).then(async (video) => {
    // Assuming that endscreen duration is 14 sec
    const videoLengthSec = parseInt(video.lengthSeconds)
    const end_screen_start = (videoLengthSec - 14) * 1000

    console.log(`Video length is: ${videoLengthSec}, endscreen will start at ${end_screen_start}ms`)

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
    console.log("Response on endscreen setter request:\n", JSON.stringify(result, null, 4))
}).catch((err) => {
    console.log(err)
    process.exit(-1)
})
