const BUZZER_OFF = 0x00;
const BUZZER_ALWAYS_ON = 0x80;
const BUZZER_1HZ = 0x90;
const BUZZER_5HZ = 0xA0;
const BUZZER_3_TONES_2_SEC_PAUSE = 0xB0;

const buzzerModeToBits = {
    "off": BUZZER_OFF,
    "on": BUZZER_ALWAYS_ON,
    "1hz": BUZZER_1HZ,
    "5hz": BUZZER_5HZ,
    "3tones2sec": BUZZER_3_TONES_2_SEC_PAUSE
};

const colorToBits = {
    "off": 0x00,
    "green": 0x01,
    "red": 0x02,
    "yellow": 0x03,
    "blue": 0x04,
    "orange": 0x05,
    "white": 0x07
};

const blinkByOption = {
    "off": 0,
    "on": 1,
    "flash": 1
};

const flashByOption = {
    "off": 0,
    "on": 0,
    "flash": 1
};

const blinkFrequencyToBits = {
    "0.5": 0x01,
    "1": 0x02,
    "2": 0x03,
    "5": 0x04,
    "10": 0x05,
};

// const configTemplate = {
//     buzzer: {
//         mode: "off",
//         volume: 128
//     },

//     blinkFrequencyInHerz: 0.5,

//     segments: [
//         {
//             blink: "off",
//             color: "off",
//         },
//         {
//             blink: "on",
//             color: "green",
//         },
//         {
//             blink: "flash",
//             color: "red",
//         }
//     ]
// };

const segmentMode = () => {

    const parseSegment = ({ segment }) => {
        const blink = blinkByOption[segment.blink];
        const flash = flashByOption[segment.blink];

        if (blink === undefined || flash === undefined) {
            throw Error("invalid blink option");
        }

        const colorBits = colorToBits[segment.color];
        if (colorBits === undefined) {
            throw Error("invalid color option");
        }

        return {
            blink,
            flash,
            colorBits
        };
    };

    const segmentFallback = {
        blink: "off",
        color: "off"
    };

    const configBytesFor = ({
        buzzer,
        blinkFrequencyInHz,
        segments
    }) => {

        const buzzerBits = buzzerModeToBits[buzzer.mode];
        if (buzzerBits === undefined) {
            throw Error("invalid buzzer option");
        }

        if (buzzer.volume === undefined || isNaN(buzzer.volume)) {
            throw Error("invalid buzzer volume");
        }

        if (buzzer.volume < 0 || buzzer.volume > 255) {
            throw Error("expected volume to be 0-255");
        }

        if (segments.length < 1 || segments.length > 3) {
            throw Error("expected 1-3 segments");
        }

        const { blink: blink1, flash: flash1, colorBits: colorBits1 } = parseSegment({ segment: segments.length >= 1 ? segments[0] : segmentFallback });
        const { blink: blink2, flash: flash2, colorBits: colorBits2 } = parseSegment({ segment: segments.length >= 2 ? segments[1] : segmentFallback });
        const { blink: blink3, flash: flash3, colorBits: colorBits3 } = parseSegment({ segment: segments.length >= 3 ? segments[2] : segmentFallback });

        const blinkFrequencyBits = blinkFrequencyToBits[blinkFrequencyInHz];
        if (blinkFrequencyBits === undefined) {
            throw Error("invalid blink frequency");
        }

        const configBytes = new Uint8Array(8);

        configBytes[0] = (blink2 << 7) | (colorBits2 << 4) | (blink1 << 3) | (colorBits1 << 0);
        configBytes[1] = (blink3 << 3) | (colorBits3 << 0);
        configBytes[2] = buzzerBits;
        // segment mode
        configBytes[3] = 0x01;
        configBytes[4] = segments.length;
        configBytes[5] = (flash3 << 2) | (flash2 << 1) | (flash1 << 0);
        configBytes[6] = blinkFrequencyBits;
        configBytes[7] = buzzer.volume;

        return configBytes;
    };

    return {
        configBytesFor
    };
};

module.exports = {
    segmentMode,
};
