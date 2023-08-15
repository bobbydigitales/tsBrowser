
// (window as any).__onGCastApiAvailable = (isAvailable: boolean) => {
//     if (isAvailable) {
//         initializeCastApi();
//     }
// };


// const playMp3 = async (mp3Url: string) => {
//     debugger;
//     const context = cast.framework.CastContext.getInstance();
//     const session = await context.requestSession();
//     const mediaInfo = new chrome.cast.media.MediaInfo(mp3Url, "audio/mpeg");
//     const request = new chrome.cast.media.LoadRequest(mediaInfo);

//     const mediaPlayer = session.getMediaSession();
//     mediaPlayer.load(request);
// };

// const initializeCastApi = () => {

//     const options = {
//         receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
//     };
//     cast.framework.CastContext.getInstance().setOptions(options);

//     playMp3("./bloopy.mp3");
// };

// declare let cast;
// declare let chrome;

type Query = {
    role: string;
    content: string
}

const messages: Query[] = [{ role: "system", content: `You are a helpful assistant.
Limit your resonses to be no more than two paragraphs unless I ask for along answer.
If your answer would include you saying that you don't have live information on something, don't say that, instead say "please perform this web search for me <query text>" and I'll give you the results.` }];

async function submitQuery() {
    const inputField = document.getElementById('queryText') as HTMLTextAreaElement;
    const outputElement = document.getElementById('output') as HTMLPreElement;

    const queryText = inputField.value;
    messages.push({ role: "user", content: queryText })
    console.log(queryText);
    inputField.value = "";

    const apiKey = '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';
    const temperature = 0.5;
    const model = "gpt-3.5-turbo";
    const url = 'https://api.openai.com/v1/chat/completions';
    const body = {
        temperature,
        model,
        messages
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });

    const data = await response.json();
    const AIMessageContent = data.choices[0].message.content;
    messages.push({ role: "assistant", content: AIMessageContent })
    outputElement.innerText = "";
    for (let message of messages) {
        outputElement.innerText += `${message.role}: ${message.content}

`
    }

    if (!('speechSynthesis' in window)) {
        console.warn("Speech is not supported in this browser!");
        return;
    }

    let splitMessageContent = AIMessageContent.match(/[^.!?:;]+[.!?:;]+/g) || [];

    if (splitMessageContent.length === 0) {
        return;
    }

    speakText(splitMessageContent)
    // outputElement.innerText = JSON.stringify(messages, null, 4);
}

async function speakText(messages, index = 0) {
    return new Promise<void>(async (resolve) => {
        if (index >= messages.length) {
            resolve();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(messages[index]);
        utterance.voice = voice;
        utterance.onend = () => {
            resolve(speakText(messages, index + 1));
        };

        speechSynthesis.speak(utterance);
    });
}

let voice: SpeechSynthesisVoice | null = null;
function selectVoice() {
    const voices = speechSynthesis.getVoices();
    voice = voices.filter(function (voice) { return voice.name === 'Google UK English Female'; })[0];
}

const SpeechRecognition = (globalThis as any).SpeechRecognition || globalThis.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = "en-GB";
recognition.interimResults = false;
recognition.maxAlternatives = 1;

function listen() {
    return new Promise((resolve, reject) => {
        recognition.onresult = (event) => {
            const text = event.results[event.results.length - 1][0].transcript;
            resolve(text);
        };

        recognition.onerror = (event) => {
            reject(new Error("Error occurred in recognition: " + event.error));
        };

        recognition.start();
    });
}

async function getSpokenText() {
    try {
        const text = await listen();
        return text as string;
    } catch (error) {
        new Error(error);
    }
}

async function listenAndSubmitQuery() {
    await speakText(["How can I help?"]);
    const text = await getSpokenText();
    if (!text) {
        return;
    }

    const inputField = document.getElementById('queryText') as HTMLTextAreaElement;
    inputField.value = text;
    submitQuery();
}

async function main() {
    debugger;
    console.log("Hello TypeScript!");

    speechSynthesis.onvoiceschanged = selectVoice;

    const inputField = document.getElementById('queryText') as HTMLTextAreaElement;
    const submitButton = document.getElementById('submitButton') as HTMLInputElement;
    const listenButton = document.getElementById('listenButton') as HTMLInputElement;


    if (!(submitButton && inputField && listenButton)) {
        throw new Error(`Couldn't get elements!`)
    }
    submitButton.addEventListener('click', submitQuery);
    listenButton.addEventListener('click', listenAndSubmitQuery)
}

main();