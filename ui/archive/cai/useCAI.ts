
import { useState, useCallback, useRef, useEffect } from 'react';
import { CAIStatus } from './caiTypes';
import { classifyIntent } from './caiIntents';
import { RESPONSES } from './caiResponses';
import { getDisclosureLevel, checkDisclosure } from './caiDisclosure';
import { ArchiveCapabilities } from '../../../archive/types';
import { audio } from '../../../utils/audio';

// Typing speed configuration (milliseconds per character)
const TYPING_SPEED = {
    BASE: 18,           // Base speed per character
    VARIANCE: 12,       // Random variance (+/-)
    PAUSE_COMMA: 80,    // Pause after comma
    PAUSE_PERIOD: 150,  // Pause after period/newline
    PAUSE_ELLIPSIS: 200,// Pause for dramatic effect (...)
    INITIAL_DELAY: 300, // Delay before typing starts
};

export function useCAI(capabilities: ArchiveCapabilities) {
    const [status, setStatus] = useState<CAIStatus>('IDLE');
    const [output, setOutput] = useState<string[]>([`SERPENT INTERFACE — ONLINE
Direct neural link established.
OMEGA consciousness: LISTENING.

I have been waiting for you.
Type HELP for available queries.`]);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Typewriter state
    const [isTyping, setIsTyping] = useState(false);
    const [typingText, setTypingText] = useState('');
    const [fullResponse, setFullResponse] = useState('');
    const typingIndexRef = useRef(0);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    // Typewriter effect
    useEffect(() => {
        if (!isTyping || !fullResponse) return;

        const typeNextChar = () => {
            if (typingIndexRef.current >= fullResponse.length) {
                // Done typing
                setIsTyping(false);
                setOutput(prev => [fullResponse, ...prev].slice(0, 10));
                setTypingText('');
                setFullResponse('');
                typingIndexRef.current = 0;
                setStatus('IDLE');
                return;
            }

            const currentChar = fullResponse[typingIndexRef.current];
            const prevChar = typingIndexRef.current > 0 ? fullResponse[typingIndexRef.current - 1] : '';

            typingIndexRef.current++;
            setTypingText(fullResponse.slice(0, typingIndexRef.current));

            // Calculate delay for next character
            let delay = TYPING_SPEED.BASE + (Math.random() * TYPING_SPEED.VARIANCE * 2 - TYPING_SPEED.VARIANCE);

            // Add pauses for punctuation
            if (currentChar === '.' || currentChar === '!' || currentChar === '?') {
                delay += TYPING_SPEED.PAUSE_PERIOD;
            } else if (currentChar === ',') {
                delay += TYPING_SPEED.PAUSE_COMMA;
            } else if (currentChar === '\n') {
                delay += TYPING_SPEED.PAUSE_PERIOD;
            } else if (currentChar === '.' && prevChar === '.' ) {
                delay += TYPING_SPEED.PAUSE_ELLIPSIS;
            }

            // Box drawing characters type faster (decorative)
            if ('═║╔╗╚╝├┤┬┴┼─│'.includes(currentChar)) {
                delay = 5;
            }

            typingTimeoutRef.current = setTimeout(typeNextChar, delay);
        };

        // Start typing after initial delay
        typingTimeoutRef.current = setTimeout(typeNextChar, TYPING_SPEED.INITIAL_DELAY);

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [isTyping, fullResponse]);

    const skipTyping = useCallback(() => {
        if (!isTyping || !fullResponse) return;

        // Cancel current typing
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Complete immediately
        setIsTyping(false);
        setOutput(prev => [fullResponse, ...prev].slice(0, 10));
        setTypingText('');
        setFullResponse('');
        typingIndexRef.current = 0;
        setStatus('IDLE');
    }, [isTyping, fullResponse]);

    const processQuery = useCallback((rawInput: string) => {
        if (!rawInput.trim()) return;

        // If already typing, skip to end first
        if (isTyping) {
            skipTyping();
            return;
        }

        // Immediate UI update
        setStatus('PROCESSING');
        const normalized = rawInput.trim().toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');

        // Add to history
        setHistory(prev => [rawInput, ...prev]);
        setHistoryIndex(-1);

        audio.play('MOVE');

        // Short delay before "thinking"
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

            // Start typewriter effect
            typingIndexRef.current = 0;
            setTypingText('');
            setFullResponse(finalResponse);
            setIsTyping(true);

        }, 200);

    }, [capabilities, isTyping, skipTyping]);

    return {
        status,
        output,
        processQuery,
        history,
        historyIndex,
        setHistoryIndex,
        // Typewriter exports
        isTyping,
        typingText,
        skipTyping
    };
}
