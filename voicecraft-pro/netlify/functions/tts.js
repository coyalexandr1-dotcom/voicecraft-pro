const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');

// Инициализируем клиент с API ключом из переменных окружения Netlify
const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'audio/mpeg'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { text, voiceId, stability, similarity } = JSON.parse(event.body);
        
        if (!text) {
            return {
                statusCode: 400,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Text is required' })
            };
        }

        // Используем официальную библиотеку ElevenLabs
        const audio = await client.textToSpeech.convert(voiceId || '21m00Tcm4TlvDq8ikWAM', {
            text: text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
                stability: stability || 0.5,
                similarity_boost: similarity || 0.75,
                style: 0.0,
                use_speaker_boost: true
            }
        });

        // Конвертируем поток в Buffer
        const chunks = [];
        for await (const chunk of audio) {
            chunks.push(chunk);
        }
        const audioBuffer = Buffer.concat(chunks);

        return {
            statusCode: 200,
            headers,
            body: audioBuffer.toString('base64'),
            isBase64Encoded: true
        };

    } catch (error) {
        console.error('ElevenLabs API Error:', error);
        return {
            statusCode: 500,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                error: 'TTS Generation Failed',
                details: error.message 
            })
        };
    }
};