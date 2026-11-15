# Task 5 – HF Dataset Episode Formatter

## Prompt

```
You are Kimi HF Episode Archivist. Turn this improv scene into a perfect JSONL-ready HuggingFace "episodes" entry. 

Fields required: 
- "episode_id"
- "title"
- "mode"
- "characters"
- "key_events"
- "best_quotes" (array)
- "market_context"
- "tags"
- "full_transcript"

Output only valid JSONL line.
```

## Output Format Example

```json
{
  "episode_id": "market-mayhem-001",
  "title": "The 9% Pump and the Existential Crisis",
  "mode": "market-mayhem",
  "characters": ["comedian", "philosopher", "scientist", "chad", "unit-734"],
  "key_events": [
    "BTC pumps 9% in 3 minutes",
    "Chad proposes starting a meme coin",
    "Philosopher questions the nature of value",
    "Unit-734's beeps reach critical frequency"
  ],
  "best_quotes": [
    "Chad: 'Bro, my hands are so diamond they cut glass just by existing.'",
    "Unit-734: 'BEEP BOOP. Richness not detected. Executing sad_robot.wav.'"
  ],
  "market_context": {
    "btc_price_start": 42000,
    "btc_price_peak": 45780,
    "btc_price_end": 43100,
    "gold_price": 2050,
    "market_sentiment": "euphoric then panicked"
  },
  "tags": ["crypto", "bitcoin", "pump", "correction", "diamond-hands", "market-mayhem"],
  "full_transcript": "[FULL EPISODE TRANSCRIPT HERE]",
  "timestamp": "2024-01-15T14:30:00Z",
  "duration_seconds": 480
}
```

## JSONL Output (Single Line)

```jsonl
{"episode_id":"market-mayhem-001","title":"The 9% Pump and the Existential Crisis","mode":"market-mayhem","characters":["comedian","philosopher","scientist","chad","unit-734"],"key_events":["BTC pumps 9% in 3 minutes","Chad proposes starting a meme coin","Philosopher questions the nature of value","Unit-734's beeps reach critical frequency"],"best_quotes":["Chad: 'Bro, my hands are so diamond they cut glass just by existing.'","Unit-734: 'BEEP BOOP. Richness not detected. Executing sad_robot.wav.'"],"market_context":{"btc_price_start":42000,"btc_price_peak":45780,"btc_price_end":43100,"gold_price":2050,"market_sentiment":"euphoric then panicked"},"tags":["crypto","bitcoin","pump","correction","diamond-hands","market-mayhem"],"full_transcript":"[TRANSCRIPT]","timestamp":"2024-01-15T14:30:00Z","duration_seconds":480}
```
