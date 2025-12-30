
import { useState, useCallback } from 'react';
import { CAIStatus } from './caiTypes';
import { classifyIntent } from './caiIntents';
import { RESPONSES } from './caiResponses';
import { getDisclosureLevel, checkDisclosure } from './caiDisclosure';
import { ArchiveCapabilities } from '../../../archive/types';
import { audio } from '../../../utils/audio';

export function useCAI(capabilities: ArchiveCapabilities) {
    const [status, setStatus] = useState<CAIStatus>('IDLE');
    const [output, setOutput] = useState<string[]>(['CAI-OS ONLINE. AWAITING INPUT.']);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const processQuery = useCallback((rawInput: string) => {
        if (!rawInput.trim()) return;
        
        // Immediate UI update
        setStatus('PROCESSING');
        const normalized = rawInput.trim().toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
        
        // Add to history
        setHistory(prev => [rawInput, ...prev]);
        setHistoryIndex(-1);
        
        audio.play('MOVE');

        // Deterministic Delay (Fixed 400ms)
        setTimeout(() => {
            const intent = classifyIntent(normalized);
            const responseDef = RESPONSES[intent.id] || RESPONSES['UNKNOWN'];
            
            // Disclosure Gate
            const currentLevel = getDisclosureLevel(capabilities);
            const isAllowed = checkDisclosure(currentLevel, responseDef.disclosureRequired);
            
            let finalResponse = responseDef.text;
            
            if (!isAllowed) {
                finalResponse = `REQUEST DENIED.\nINSUFFICIENT AUTHORIZATION.\nREQUIRED: ${responseDef.disclosureRequired}`;
                audio.play('ARCHIVE_LOCK');
            } else {
                audio.play('XP_COLLECT');
            }

            setOutput(prev => [finalResponse, ...prev].slice(0, 10)); 
            setStatus('IDLE');
        }, 400);
        
    }, [capabilities]);

    return { status, output, processQuery, history, historyIndex, setHistoryIndex };
}
