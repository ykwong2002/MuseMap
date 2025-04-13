import { useState, useEffect, useCallback } from 'react';
import * as Tone from 'tone';

export type SynthType = 'basic' | 'fm' | 'am' | 'mono';
export type EffectType = 'reverb' | 'delay' | 'distortion';

interface SynthSettings {
    type: SynthType;
    effects: EffectType[];
    volume: number;
}

export const useSynth = (initialSettings?: Partial<SynthSettings>) => {
    const [synth, setSynth] = useState<Tone.PolySynth | null>(null);
    const [settings, setSettings] = useState<SynthSettings>({
        type: initialSettings?.type || 'basic',
        effects: initialSettings?.effects || [],
        volume: initialSettings?.volume || 0
    });

    const createSynth = useCallback((type: SynthType) => {
        const synthOptions = {
            envelope: {
                attack: 0.02,
                decay: 0.1,
                sustain: 0.3,
                release: 1
            }
        };

        switch (type) {
            case 'fm':
                return new Tone.PolySynth<Tone.FMSynth>(Tone.FMSynth, synthOptions);
            case 'am':
                return new Tone.PolySynth<Tone.AMSynth>(Tone.AMSynth, synthOptions);
            case 'mono':
                return new Tone.PolySynth<Tone.MonoSynth>(Tone.MonoSynth, synthOptions);
            default:
                return new Tone.PolySynth<Tone.Synth>(Tone.Synth, synthOptions);
        }
    }, []);

    const setupEffectChain = useCallback((synth: Tone.PolySynth, effects: EffectType[]) => {
        const chain: Tone.ToneAudioNode[] = [synth];

        effects.forEach(effect => {
            switch (effect) {
                case 'reverb':
                    chain.push(new Tone.Reverb(2).toDestination());
                    break;
                case 'delay':
                    chain.push(new Tone.FeedbackDelay('8n', 0.3).toDestination());
                    break;
                case 'distortion':
                    chain.push(new Tone.Distortion(0.4).toDestination());
                    break;
            }
        });

        // Connect all nodes in the chain
        chain.reduce((prev, curr) => {
            prev.connect(curr);
            return curr;
        });

        return chain;
    }, []);

    useEffect(() => {
        const newSynth = createSynth(settings.type);
        const chain = setupEffectChain(newSynth, settings.effects);
        const lastNode = chain[chain.length - 1];
        
        if (lastNode instanceof Tone.Volume) {
            lastNode.volume.value = settings.volume;
        } else {
            const vol = new Tone.Volume(settings.volume).toDestination();
            lastNode.connect(vol);
        }

        setSynth(newSynth);

        return () => {
            newSynth.dispose();
            chain.forEach(node => node.dispose());
        };
    }, [settings, createSynth, setupEffectChain]);

    const updateSettings = useCallback((newSettings: Partial<SynthSettings>) => {
        setSettings(prev => ({
            ...prev,
            ...newSettings
        }));
    }, []);

    return {
        synth,
        settings,
        updateSettings
    };
};