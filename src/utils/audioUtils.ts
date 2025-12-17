export function resampleBuffer(
    buffer: Float32Array,
    fromSampleRate: number,
    toSampleRate: number
): Float32Array {
    if (fromSampleRate === toSampleRate) {
        return buffer;
    }

    const ratio = fromSampleRate / toSampleRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
        const sourceIndex = i * ratio;
        const index = Math.floor(sourceIndex);
        const fraction = sourceIndex - index;

        if (index + 1 < buffer.length) {
            result[i] = buffer[index] * (1 - fraction) + buffer[index + 1] * fraction;
        } else {
            result[i] = buffer[index];
        }
    }

    return result;
}

export function floatTo16BitPCM(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);

    for (let i = 0; i < float32Array.length; i++) {
        const sample = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }

    return int16Array;
}

export function convertToMono(channelData: Float32Array[]): Float32Array {
    if (channelData.length === 1) {
        return channelData[0];
    }

    const length = channelData[0].length;
    const mono = new Float32Array(length);

    for (let i = 0; i < length; i++) {
        let sum = 0;
        for (let channel = 0; channel < channelData.length; channel++) {
            sum += channelData[channel][i];
        }
        mono[i] = sum / channelData.length;
    }

    return mono;
}

export function prepareAudioChunk(
    audioBuffer: AudioBuffer,
    targetSampleRate: number
): Int16Array {
    const channelData: Float32Array[] = [];
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        channelData.push(audioBuffer.getChannelData(i));
    }

    const mono = convertToMono(channelData);
    const resampled = resampleBuffer(mono, audioBuffer.sampleRate, targetSampleRate);
    return floatTo16BitPCM(resampled);
}
