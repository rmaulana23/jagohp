
import React, { useState, useEffect, useMemo, FC, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenAI, Type } from "@google/genai";
import SparklesIcon from './icons/SparklesIcon';
import XMarkIcon from './icons/XMarkIcon';


// --- Type Definitions ---
interface PhoneSpecs {
  processorName: string;
  cpuScore: number;
  batteryMah: number;
  ramGb: number;
  refreshRate: number;
  cameraScore: number;
}

interface GameStats {
  attack: number;
  defense: number;
  speed: number;
  intelligence: number;
  battery: number;
}

interface CardData {
  id: string;
  name: string;
  specs: PhoneSpecs;
  stats: GameStats;
}

type Action = 'attack' | 'heal' | 'skill';

interface GameState {
  playerHealth: number;
  opponentHealth: number;
  opponentEnergy: number;
  playerMoveHistory: Action[];
}

// --- Sound Effects Engine ---
const useSoundEffects = () => {
    const audioCtx = useRef<AudioContext | null>(null);

    const initializeAudio = () => {
        if (!audioCtx.current && typeof window !== 'undefined') {
            audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    };

    const playSound = (type: OscillatorType, frequency: number, duration: number, volume: number = 0.3) => {
        if (!audioCtx.current) return;
        const oscillator = audioCtx.current.createOscillator();
        const gainNode = audioCtx.current.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.current.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioCtx.current.currentTime);
        gainNode.gain.setValueAtTime(volume, audioCtx.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(audioCtx.current.currentTime + duration);
    };
    
    const playAttackSound = () => {
      if (!audioCtx.current) return;
      playSound('square', 300, 0.1, 0.2);
      playSound('sawtooth', 100, 0.1, 0.1);
    };

    const playHealSound = () => {
      if (!audioCtx.current) return;
      playSound('sine', 600, 0.2, 0.3);
      playSound('sine', 900, 0.2, 0.3);
    };

    const playSkillSound = () => {
       if (!audioCtx.current) return;
       playSound('sawtooth', 200, 0.3, 0.4);
       playSound('square', 400, 0.3, 0.4);
    };

    const playWinSound = () => {
        if (!audioCtx.current) return;
        playSound('sine', 523.25, 0.1); // C5
        setTimeout(() => playSound('sine', 659.25, 0.1), 100); // E5
        setTimeout(() => playSound('sine', 783.99, 0.1), 200); // G5
        setTimeout(() => playSound('sine', 1046.50, 0.2), 300); // C6
    };
    
    const playLoseSound = () => {
        if (!audioCtx.current) return;
        playSound('sawtooth', 300, 0.3);
        setTimeout(() => playSound('sawtooth', 150, 0.4), 150);
    };
    
    const playStartSound = () => playSound('triangle', 800, 0.15);

    return { initializeAudio, playAttackSound, playHealSound, playSkillSound, playWinSound, playLoseSound, playStartSound };
};


// --- Utility Functions ---
const mapSpecsToStats = (specs: PhoneSpecs): GameStats => {
  const attack = Math.round(Math.max(10, Math.min(100, specs.cpuScore / 3000)));
  const defense = Math.round(Math.max(10, Math.min(100, specs.batteryMah / 50)));
  const speed = Math.round(Math.max(10, Math.min(100, specs.ramGb * 6 + specs.refreshRate / 8)));
  const intelligence = Math.round(Math.max(10, Math.min(100, specs.cameraScore * 1.1)));
  const battery = Math.round(Math.max(10, Math.min(100, specs.batteryMah / 45)));
  return { attack, defense, speed, intelligence, battery };
};

const calcPower = (stats: GameStats, luck: number = 0): number => {
  const power = stats.attack * 0.4 + stats.speed * 0.25 + stats.intelligence * 0.2 + stats.battery * 0.15 + luck;
  return Math.round(power);
};

const rollLuck = (): number => Math.round((Math.random() - 0.5) * 10); // -5 to +5

// --- Sophisticated AI Logic ---
const getOpponentChoice = (state: GameState, skillCooldown: number, healCooldown: number): Action => {
    const { playerHealth, opponentHealth, opponentEnergy, playerMoveHistory } = state;
    
    let weights = { attack: 40, heal: 30, skill: 0 };
    
    if (healCooldown > 0) weights.heal = 0;

    if (opponentHealth < 30) { weights.heal += 50; weights.attack -= 20; } 
    else if (opponentHealth < 50) { weights.heal += 25; }

    if (playerHealth < 30) { weights.attack += 40; weights.heal -= 15; } 
    else if (playerHealth < 50) { weights.attack += 20; }
    
    if (playerMoveHistory.length > 3) {
        const attackFreq = playerMoveHistory.filter(m => m === 'attack').length / playerMoveHistory.length;
        const healFreq = playerMoveHistory.filter(m => m === 'heal').length / playerMoveHistory.length;

        if (attackFreq > 0.6) { weights.heal += 25; weights.attack -= 10; }
        if (healFreq > 0.5) { weights.attack += 20; }
    }

    if (opponentEnergy >= 40 && skillCooldown === 0) {
        weights.skill += 30;
        if (playerHealth < 60) weights.skill += 30;
        if (opponentHealth > 80 && playerHealth > 80) weights.skill -= 15;
    }

    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + Math.max(0, weight), 0);
    let random = Math.random() * totalWeight;

    for (const move in weights) {
        const weight = Math.max(0, weights[move as Action]);
        if (random < weight) return move as Action;
        random -= weight;
    }

    return 'attack'; // Fallback
};

// --- Card Components ---
const Card: FC<{ card: CardData | null; isPlayer?: boolean; health?: number; highlight?: string | null }> = ({ card, isPlayer, health, highlight }) => {
    if (!card) {
        return <div className="w-56 md:w-64 h-[218px] bg-gray-800/80 rounded-2xl p-4 flex items-center justify-center"><div className="text-gray-400">No Card</div></div>;
    }
    const statsToShow = [
        { key: "attack", label: "⚔️ ATK" }, 
        { key: "defense", label: "🛡️ DEF" }, 
        { key: "speed", label: "⚡ SPD" }, 
        { key: "intelligence", label: "🎯 INT" }
    ];
    return (
        <div className="w-56 md:w-64 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/10">
            <div className="flex justify-between items-start">
            <div>
                <h3 className="text-white text-base font-bold leading-tight">{card.name}</h3>
                <p className="text-xs text-gray-400">{isPlayer ? "Player" : "Opponent"}</p>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
                <div className="text-2xl font-bold text-white">{health ?? 100}</div>
                <div className="text-xs text-gray-400 -mt-1">HP</div>
            </div>
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden mt-2">
            <div
                className={`h-full rounded-full transition-all duration-300 ${health! > 60 ? "bg-green-400" : health! > 30 ? "bg-yellow-400" : "bg-red-500"}`}
                style={{ width: `${Math.max(0, Math.min(100, health ?? 100))}%` }}
            />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {statsToShow.map((s, index) => (
                <div 
                    key={s.key} 
                    className={`
                        col-span-1 rounded p-1.5 transition-colors 
                        ${highlight === s.key ? 'bg-indigo-500/30' : 'bg-white/5'}
                        ${index > 1 ? 'hidden lg:flex' : 'flex'} justify-between items-center
                    `}
                >
                    <span className="text-gray-200 font-medium">{s.label}</span>
                    <span className="text-gray-200 font-medium">{card.stats[s.key as keyof GameStats]}</span>
                </div>
            ))}
            </div>
        </div>
    );
};

const InfoDesk: FC<{ card: CardData | null }> = ({ card }) => {
  if (!card?.specs) return <div className="h-[54px] w-56 md:w-64 hidden lg:block"></div>; // Placeholder for layout stability
  return (
    <div className="hidden lg:block mt-2 text-center text-xs text-gray-300 w-56 md:w-64 p-2 bg-black/20 rounded-lg">
      <p className="font-semibold truncate" title={card.specs.processorName}>{card.specs.processorName}</p>
      <p>{card.specs.ramGb}GB RAM | {card.specs.batteryMah} mAh</p>
    </div>
  );
};


// --- Main Game Component ---
const JCC: React.FC = () => {
  const { initializeAudio, playAttackSound, playHealSound, playSkillSound, playWinSound, playLoseSound, playStartSound } = useSoundEffects();
  const [deck, setDeck] = useState<CardData[]>([]);
  const [deckLoading, setDeckLoading] = useState(false);
  const [deckError, setDeckError] = useState<string|null>(null);

  const [playerCard, setPlayerCard] = useState<CardData | null>(null);
  const [opponentCard, setOpponentCard] = useState<CardData | null>(null);

  const [playerHealth, setPlayerHealth] = useState(100);
  const [opponentHealth, setOpponentHealth] = useState(100);
  const [playerEnergy, setPlayerEnergy] = useState(0);
  const [opponentEnergy, setOpponentEnergy] = useState(0);
  const [round, setRound] = useState(1);
  const [log, setLog] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastHighlight, setLastHighlight] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [playerMoveHistory, setPlayerMoveHistory] = useState<Action[]>([]);
  const [currentTurn, setCurrentTurn] = useState<'player' | 'opponent' | null>(null);
  const [turnMessage, setTurnMessage] = useState<string | null>(null);

  const [playerSkillCooldown, setPlayerSkillCooldown] = useState(0);
  const [opponentSkillCooldown, setOpponentSkillCooldown] = useState(0);
  const [playerHealCooldown, setPlayerHealCooldown] = useState(0);
  const [opponentHealCooldown, setOpponentHealCooldown] = useState(0);
  
  const [playerCardHealths, setPlayerCardHealths] = useState<{ [key: string]: number }>({});
  const [opponentCardHealths, setOpponentCardHealths] = useState<{ [key: string]: number }>({});
  const [coinTossState, setCoinTossState] = useState<'pending' | 'tossing' | 'done'>('done');

  const [isGachaTime, setIsGachaTime] = useState(false);
  const [gachaLoading, setGachaLoading] = useState(false);
  const [gachaCount, setGachaCount] = useState(0);


  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);
  
  useEffect(() => {
    if (playerCard) {
        setPlayerCardHealths(prev => ({ ...prev, [playerCard.id]: playerHealth }));
    }
  }, [playerHealth, playerCard]);

  useEffect(() => {
      if (opponentCard) {
          setOpponentCardHealths(prev => ({ ...prev, [opponentCard.id]: opponentHealth }));
      }
  }, [opponentHealth, opponentCard]);

   useEffect(() => {
    if (round > 1 && round % 5 === 0 && !isAnimating && !gameOver && !isGachaTime && gachaCount < 2) {
        const lastGachaRound = parseInt(localStorage.getItem('lastGachaRound') || '0');
        if (round > lastGachaRound) {
            setIsGachaTime(true);
            pushLog(`Round ${round}! It's Gacha Time!`);
            localStorage.setItem('lastGachaRound', String(round));
        }
    }
  }, [round, isAnimating, gameOver, isGachaTime, gachaCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlayerSkillCooldown(prev => Math.max(0, prev - 1));
      setOpponentSkillCooldown(prev => Math.max(0, prev - 1));
      setPlayerHealCooldown(prev => Math.max(0, prev - 1));
      setOpponentHealCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const pushLog = (txt: string) => {
    setLog(l => [`[R${round}] ${txt}`, ...l].slice(0, 8));
  };
  
  const handleGameOver = (winner: 'player' | 'opponent' | 'draw') => {
      const message = winner === 'player' ? 'Victory!' : winner === 'opponent' ? 'Defeat...' : 'Draw!';
      if(winner === 'player') playWinSound(); else playLoseSound();
      setGameOver(message);
      pushLog(winner === 'player' ? "You win!" : winner === 'opponent' ? "You lose." : "It's a draw!");
      setCurrentTurn(null);
  };

  const playOpponentTurn = () => {
    if (!playerCard || !opponentCard) return;
    setIsAnimating(true);

    const availableSwitchCards = deck.filter(c => c.id !== opponentCard.id && c.id !== playerCard.id && (opponentCardHealths[c.id] || 100) > 0);
    if (opponentHealth < 35 && availableSwitchCards.length > 0 && Math.random() < 0.5) {
        const newCard = availableSwitchCards[Math.floor(Math.random() * availableSwitchCards.length)];
        
        setOpponentCard(newCard);
        setOpponentHealth(opponentCardHealths[newCard.id] || 100);
        setOpponentEnergy(0);
        pushLog(`Opponent switched to ${newCard.name}!`);
        
        setTimeout(() => {
            setIsAnimating(false);
            setRound(r => r + 1);
            setCurrentTurn('player');
        }, 1000);
        return;
    }

    const choice = getOpponentChoice({ playerHealth, opponentHealth, opponentEnergy, playerMoveHistory }, opponentSkillCooldown, opponentHealCooldown);
    pushLog(`Opponent chose ${choice.toUpperCase()}`);

    setTimeout(() => {
        const oLuck = rollLuck();
        let oPower = calcPower(opponentCard.stats, oLuck);

        if (choice === "attack") { oPower = Math.round(oPower * 1.1); setLastHighlight('attack'); playAttackSound(); }
        if (choice === "heal") { oPower = Math.round(oPower * 0.7); setLastHighlight('defense'); playHealSound(); setOpponentHealCooldown(30); }
        if (choice === "skill" && opponentEnergy >= 40) { oPower = Math.round(oPower * 1.5); setLastHighlight('intelligence'); setOpponentEnergy(e => e - 40); setOpponentSkillCooldown(60); playSkillSound(); }

        const damageToPlayer = choice !== 'heal' ? Math.max(3, Math.round((oPower - playerCard.stats.defense * 0.6) / 5) + Math.round((Math.random() - 0.5) * 4)) : 0;
        
        let newPlayerHealth = playerHealth - damageToPlayer;
        if (choice === "heal") setOpponentHealth(h => Math.min(100, h + 6));
        
        newPlayerHealth = Math.max(0, Math.round(newPlayerHealth));
        setPlayerHealth(newPlayerHealth);
        pushLog(`Opponent dealt ${damageToPlayer} damage.`);
        
        setTimeout(() => {
            setIsAnimating(false);
            setLastHighlight(null);
            if (newPlayerHealth <= 0) {
                handleGameOver(opponentHealth > 0 ? 'opponent' : 'draw');
            } else {
                setPlayerEnergy(e => Math.min(100, e + 15));
                setOpponentEnergy(e => Math.min(100, e + 15));
                setCurrentTurn('player');
            }
        }, 800);
    }, 1000);
  };
  
  const playPlayerTurn = async (choice: Action) => {
    if (isAnimating || gameOver || currentTurn !== 'player' || !playerCard || !opponentCard) return;
    if (choice === 'skill' && playerSkillCooldown > 0) return;
    if (choice === 'heal' && playerHealCooldown > 0) return;

    const newHistory = [...playerMoveHistory, choice].slice(-10);
    setPlayerMoveHistory(newHistory);
    
    setIsAnimating(true);
    const pLuck = rollLuck();
    let pPower = calcPower(playerCard.stats, pLuck);

    if (choice === "attack") { pPower = Math.round(pPower * 1.1); setLastHighlight('attack'); playAttackSound(); }
    if (choice === "heal") { pPower = Math.round(pPower * 0.7); setLastHighlight('defense'); playHealSound(); setPlayerHealCooldown(30); }
    if (choice === "skill" && playerEnergy >= 40) { pPower = Math.round(pPower * 1.5); setLastHighlight('intelligence'); setPlayerEnergy(e => e - 40); setPlayerSkillCooldown(60); playSkillSound(); }

    const damageToOpponent = choice !== 'heal' ? Math.max(3, Math.round((pPower - opponentCard.stats.defense * 0.6) / 5) + Math.round((Math.random() - 0.5) * 4)) : 0;
    
    pushLog(`You chose ${choice.toUpperCase()}`);
    await new Promise(r => setTimeout(r, 600));

    let newOpponentHealth = opponentHealth - damageToOpponent;
    if (choice === "heal") setPlayerHealth(h => Math.min(100, h + 8));

    newOpponentHealth = Math.max(0, Math.round(newOpponentHealth));
    setOpponentHealth(newOpponentHealth);
    pushLog(`You dealt ${damageToOpponent} damage.`);
    
    await new Promise(r => setTimeout(r, 600));
    setLastHighlight(null);
    
    const newRound = round + 1;
    if (newOpponentHealth <= 0) {
        handleGameOver(playerHealth > 0 ? 'player' : 'draw');
    } else {
        setRound(newRound);
        setCurrentTurn('opponent');
        playOpponentTurn();
    }
    setIsAnimating(false);
  };

  const handleCoinToss = () => {
    setCoinTossState('tossing');
    setTurnMessage("AI melempar koin...");
    setTimeout(() => {
        const firstTurn = Math.random() < 0.5 ? 'player' : 'opponent';
        setCurrentTurn(firstTurn);
        setTurnMessage(firstTurn === 'player' ? 'Kamu jalan duluan!' : 'Lawan jalan duluan!');
        
        setTimeout(() => {
            setTurnMessage(null);
            setCoinTossState('done');
            if (firstTurn === 'opponent') {
                playOpponentTurn();
            }
        }, 1500);
    }, 1500);
  };
  
  const startBattle = () => {
    playStartSound();
    
    const initialPlayerHealths: { [key: string]: number } = {};
    const initialOpponentHealths: { [key: string]: number } = {};
    deck.forEach(card => {
        initialPlayerHealths[card.id] = 100;
        initialOpponentHealths[card.id] = 100;
    });
    setPlayerCardHealths(initialPlayerHealths);
    setOpponentCardHealths(initialOpponentHealths);

    setPlayerHealth(100);
    setOpponentHealth(100);
    setPlayerEnergy(0);
    setOpponentEnergy(0);
    setRound(1);
    setLog([`A new battle begins!`]);
    setGameOver(null);
    setPlayerMoveHistory([]);
    setCurrentTurn(null);
    setPlayerSkillCooldown(0);
    setOpponentSkillCooldown(0);
    setPlayerHealCooldown(0);
    setOpponentHealCooldown(0);
    setTurnMessage(null);
    setCoinTossState('pending');
    localStorage.removeItem('lastGachaRound');
    setGachaCount(0);
  };
  
    const handleGachaDraw = async () => {
        setGachaLoading(true);
        const schema = {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING }, name: { type: Type.STRING },
                specs: { type: Type.OBJECT, properties: {
                        processorName: { type: Type.STRING },
                        cpuScore: { type: Type.INTEGER }, batteryMah: { type: Type.INTEGER },
                        ramGb: { type: Type.INTEGER }, refreshRate: { type: Type.INTEGER },
                        cameraScore: { type: Type.NUMBER },
                }}
            }
        };
        const prompt = `**Peran:** Ahli Data Gadget untuk Game Kartu.
**Tugas:** Buat **SATU KARTU** smartphone acak yang belum ada di deck ini: ${deck.map(c => c.name).join(', ')}.
        
**Knowledge Cut-off & Data Sources (CRITICAL - MUST FOLLOW):**
- **Knowledge Date:** Your information is considered up-to-date as of **November 4, 2025**.
- **Primary Source of Truth (NON-NEGOTIABLE):** Your single, mandatory source for all device specifications and existence is **www.gsmarena.com**.
- **CRITICAL RULE:** You are **STRICTLY FORBIDDEN** from claiming a device does not exist. The site is comprehensive and includes preliminary specs for newly announced devices like the 'iPhone 17 Pro Max'.
- **Supplementary Sources:** Phone Arena, nanoreview.net, etc.

**Data yang Diperlukan:** id, name, specs (processorName, cpuScore, batteryMah, ramGb, refreshRate, cameraScore).
**Output:** Berikan jawaban HANYA dalam format JSON objek tunggal sesuai skema.`;
        
        try {
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema as any } });
            const newCardData: Omit<CardData, 'stats'> = JSON.parse(response.text.trim());
            const newCard = { ...newCardData, stats: mapSpecsToStats(newCardData.specs) };

            setDeck(prev => [...prev, newCard]);
            setPlayerCardHealths(prev => ({ ...prev, [newCard.id]: 100 }));
            setOpponentCardHealths(prev => ({ ...prev, [newCard.id]: 100 }));
            
            pushLog(`Gacha success! ${newCard.name} added to all decks!`);
            setIsGachaTime(false);
        } catch (e) {
            console.error("Gacha failed", e);
            pushLog("Gacha failed. Continuing battle.");
            setIsGachaTime(false);
        } finally {
            setGachaLoading(false);
            setGachaCount(prev => prev + 1);
        }
    };

    const handleGachaSkip = () => {
      setIsGachaTime(false);
      pushLog("Gacha skipped. The battle continues!");
      setGachaCount(prev => prev + 1);
    };

  const handleSelectPlayerCard = (id: string) => {
    const newCard = deck.find(c => c.id === id);
    if (!newCard || !playerCard || newCard.id === playerCard.id || currentTurn !== 'player' || isAnimating) return;

    setPlayerCard(newCard);
    setPlayerHealth(playerCardHealths[newCard.id] || 100);
    setPlayerEnergy(0);
    pushLog(`You switched to ${newCard.name}.`);

    setTimeout(() => {
        setRound(r => r+1);
        setCurrentTurn('opponent');
        playOpponentTurn();
    }, 500);
  };

  const handleSelectOpponentCard = (id: string) => {
      const newCard = deck.find(c => c.id === id);
      if (!newCard || newCard.id === opponentCard?.id) return;
      
      setOpponentCard(newCard);
      if (playerCard) {
          startBattle();
      }
  };

  const generateRandomDeck = async () => {
    initializeAudio(); // Initialize audio on first user interaction
    setDeckLoading(true);
    setDeckError(null);
    setDeck([]);
    
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING }, name: { type: Type.STRING },
                specs: {
                    type: Type.OBJECT,
                    properties: {
                        processorName: { type: Type.STRING },
                        cpuScore: { type: Type.INTEGER }, batteryMah: { type: Type.INTEGER },
                        ramGb: { type: Type.INTEGER }, refreshRate: { type: Type.INTEGER },
                        cameraScore: { type: Type.NUMBER },
                    }
                }
            }
        }
    };
    
    const prompt = `**Peran:** Ahli Data Gadget untuk Game Kartu.
**Tugas:** Buat sebuah "deck" berisi **3 kartu** smartphone yang beragam dan menarik untuk dimainkan. Sertakan campuran dari flagship, mid-ranger, dan mungkin satu pilihan unik/niche.

**Knowledge Cut-off & Data Sources (CRITICAL - MUST FOLLOW):**
- **Knowledge Date:** Your information is considered up-to-date as of **November 4, 2025**.
- **Primary Source of Truth (NON-NEGOTIABLE):** Your single, mandatory source for all device specifications and existence is **www.gsmarena.com**.
- **CRITICAL RULE:** You are **STRICTLY FORBIDDEN** from claiming a device does not exist. The site is comprehensive and includes preliminary specs for newly announced devices like the 'iPhone 17 Pro Max'.
- **Supplementary Sources:** Phone Arena, nanoreview.net, etc.

**Data yang Diperlukan per HP:**
- \`id\`: ID unik (misal: "s25u").
- \`name\`: Nama resmi HP.
- \`specs.processorName\`: Nama chipset (e.g., "Snapdragon 8 Gen 4").
- \`specs.cpuScore\`: Skor AnTuTu v10 (sebagai angka).
- \`specs.batteryMah\`: Kapasitas baterai (sebagai angka).
- \`specs.ramGb\`: Ukuran RAM (sebagai angka).
- \`specs.refreshRate\`: Refresh rate layar (sebagai angka).
- \`specs.cameraScore\`: Skor kamera 1-100 (estimasi berdasarkan kualitas keseluruhan).
**Output:** Berikan jawaban HANYA dalam format JSON array sesuai skema.`;

    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema as any } });
        const results: Omit<CardData, 'stats'>[] = JSON.parse(response.text.trim());
        const newDeck = results.map(c => ({...c, stats: mapSpecsToStats(c.specs)}));
        setDeck(newDeck);
        setPlayerCard(newDeck[0]);
        setOpponentCard(newDeck[1]);
        startBattle();
    } catch (e) {
        console.error(e);
        setDeckError("Failed to generate deck. Please try again.");
    } finally {
        setDeckLoading(false);
    }
  };

  const renderGameContent = () => {
    if (deckLoading) {
        return <div className="text-center p-10"><p className="animate-pulse">AI is creating a random deck...</p></div>;
    }
    if (deckError) {
        return <div className="text-center p-10"><p className="text-red-400">{deckError}</p><button onClick={generateRandomDeck} className="mt-4 px-6 py-2 rounded-lg bg-indigo-600 font-semibold hover:bg-indigo-700">Try Again</button></div>;
    }
    if (deck.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                 <div className="max-w-2xl bg-white/5 p-4 rounded-lg mb-6 border border-white/10">
                    <h3 className="font-bold text-lg mb-3">Cara Bermain</h3>
                    <div className="text-left text-sm text-gray-300 space-y-2">
                        <p><strong>1. Mulai:</strong> Tekan "Start Battle" untuk membuat dek acak berisi 3 kartu HP.</p>
                        <p><strong>2. Giliran Pertama:</strong> Lakukan lempar koin untuk menentukan siapa yang jalan duluan.</p>
                        <p><strong>3. Aksi:</strong> Pilih antara <strong>Serang</strong> (damage), <strong>Heal</strong> (pulihkan HP, cooldown 30d), atau <strong>Skill</strong> (serangan kuat, butuh 40 energi, cooldown 60d).</p>
                        <p><strong>4. Gacha:</strong> Setiap 5 ronde, dapatkan kesempatan menarik kartu baru (maks. 2x per game).</p>
                        <p><strong>5. Kemenangan:</strong> Kalahkan semua kartu lawan untuk menjadi pemenang!</p>
                    </div>
                </div>
                <button onClick={generateRandomDeck} className="px-6 py-3 rounded-lg bg-indigo-600 font-semibold hover:bg-indigo-700 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5" />
                    Start Battle
                </button>
            </div>
        );
    }

    const opponentOptions = deck.filter(c => c.id !== playerCard?.id);

    return (
       <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">

        {/* --- ARENA --- */}
        <div className="order-1 lg:order-2 lg:col-span-6 flex flex-col items-center justify-start relative">
            <AnimatePresence>
              {gameOver && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl">
                  <h2 className="text-4xl font-bold font-orbitron text-center">{gameOver}</h2>
                  {gameOver && <button onClick={startBattle} className="mt-4 px-6 py-2 rounded-lg bg-white/20 font-semibold hover:bg-white/30">Play Again</button>}
                </motion.div>
              )}
               {isGachaTime && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl p-4 text-center">
                      <h2 className="text-3xl font-bold font-orbitron text-yellow-300">Gacha Time!</h2>
                      <p className="text-gray-300 mt-2 mb-4">A new card will be added to both decks.</p>
                      <div className="flex items-center gap-4">
                          <button onClick={handleGachaDraw} disabled={gachaLoading} className="px-6 py-3 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50 flex items-center gap-2">
                             {gachaLoading ? 'Drawing...' : 'Draw New Card'}
                             {!gachaLoading && <SparklesIcon className="w-5 h-5"/>}
                          </button>
                           <button onClick={handleGachaSkip} disabled={gachaLoading} className="px-6 py-3 rounded-lg bg-white/20 text-white font-semibold hover:bg-white/30 transition-colors">
                              Skip
                          </button>
                      </div>
                  </motion.div>
               )}
              {coinTossState !== 'done' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl p-4">
                      {coinTossState === 'pending' && (
                          <>
                              <h2 className="text-2xl font-bold text-center">Siapa yang akan jalan duluan?</h2>
                              <button onClick={handleCoinToss} className="mt-4 px-6 py-3 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-600 transition-colors">
                                  Lempar Koin
                              </button>
                          </>
                      )}
                      {coinTossState === 'tossing' && (
                          <h2 className="text-4xl font-bold font-orbitron text-center animate-pulse">{turnMessage}</h2>
                      )}
                  </motion.div>
              )}
            </AnimatePresence>
            <div className="flex flex-col sm:flex-row items-center justify-around w-full gap-4">
                <div className="flex flex-col items-center">
                  <motion.div animate={{ x: isAnimating ? [0, -10, 10, -5, 5, 0] : 0 }} transition={{ duration: 0.5 }}><Card card={playerCard} isPlayer health={playerHealth} highlight={lastHighlight} /></motion.div>
                  <InfoDesk card={playerCard} />
                </div>
                <div className="text-center font-orbitron my-4 sm:my-0"><div className="text-sm text-gray-400">Round</div><div className="text-4xl font-bold">{round}</div></div>
                <div className="flex flex-col items-center">
                  <motion.div animate={{ x: isAnimating ? [0, 10, -10, 5, -5, 0] : 0 }} transition={{ duration: 0.5 }}><Card card={opponentCard} health={opponentHealth} highlight={lastHighlight} /></motion.div>
                  <InfoDesk card={opponentCard} />
                </div>
            </div>
            
            {/* DESKTOP BATTLE LOG */}
            <div className="hidden lg:block bg-white/5 rounded-xl p-3 mt-4 w-full max-w-lg">
                <h3 className="font-semibold text-gray-300 mb-2 text-center">Battle Log</h3>
                <div className="text-xs text-gray-300 h-24 overflow-y-auto space-y-1 pr-2 text-center">{log.map((l, i) => <p key={i}>{l}</p>)}</div>
            </div>
        </div>

        {/* --- MOBILE: BATTLE CONTROLS --- */}
        <div className="order-2 lg:hidden mt-4 space-y-4">
            <div className="bg-white/5 rounded-xl p-3">
              <h3 className="font-semibold text-gray-300 mb-2">Battle Controls</h3>
              <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => playPlayerTurn("attack")} disabled={isAnimating || !!gameOver || currentTurn !== 'player'} className="px-2 py-2 rounded-md bg-red-600/90 font-semibold disabled:opacity-40">⚔️ Atk</button>
                  <button onClick={() => playPlayerTurn("heal")} disabled={isAnimating || !!gameOver || currentTurn !== 'player' || playerHealCooldown > 0} className="relative px-2 py-2 rounded-md bg-green-600/90 font-semibold disabled:opacity-40">
                    ❤️ Heal
                    {playerHealCooldown > 0 && <span className="absolute -top-1 -right-1 text-xs bg-cyan-500 text-white rounded-full px-1.5 py-0.5">{playerHealCooldown}s</span>}
                  </button>
                  <button onClick={() => playPlayerTurn("skill")} disabled={isAnimating || playerEnergy < 40 || !!gameOver || currentTurn !== 'player' || playerSkillCooldown > 0} className="relative px-2 py-2 rounded-md bg-indigo-600/90 font-semibold disabled:opacity-40">
                    💥 Skill {playerSkillCooldown > 0 && <span className="absolute -top-1 -right-1 text-xs bg-cyan-500 text-white rounded-full px-1.5 py-0.5">{playerSkillCooldown}s</span>}
                  </button>
              </div>
              <div className="mt-3">
                <div className="text-xs text-gray-400">Player Energy: {playerEnergy}/100</div>
                <div className="w-full h-2.5 bg-white/10 rounded-full mt-1"><div className="h-full bg-purple-400 rounded-full" style={{ width: `${playerEnergy}%` }} /></div>
              </div>
            </div>
        </div>
        
        {/* --- PLAYER COLUMN --- */}
        <div className="order-3 lg:order-1 lg:col-span-3 space-y-4">
            <div className="hidden lg:block bg-white/5 rounded-xl p-3">
               <h3 className="font-semibold text-gray-300 mb-2">Battle Controls</h3>
              <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => playPlayerTurn("attack")} disabled={isAnimating || !!gameOver || currentTurn !== 'player'} className="px-2 py-2 rounded-md bg-red-600/90 font-semibold disabled:opacity-40">⚔️ Atk</button>
                  <button onClick={() => playPlayerTurn("heal")} disabled={isAnimating || !!gameOver || currentTurn !== 'player' || playerHealCooldown > 0} className="relative px-2 py-2 rounded-md bg-green-600/90 font-semibold disabled:opacity-40">
                    ❤️ Heal
                    {playerHealCooldown > 0 && <span className="absolute -top-1 -right-1 text-xs bg-cyan-500 text-white rounded-full px-1.5 py-0.5">{playerHealCooldown}s</span>}
                  </button>
                  <button onClick={() => playPlayerTurn("skill")} disabled={isAnimating || playerEnergy < 40 || !!gameOver || currentTurn !== 'player' || playerSkillCooldown > 0} className="relative px-2 py-2 rounded-md bg-indigo-600/90 font-semibold disabled:opacity-40">
                    💥 Skill {playerSkillCooldown > 0 && <span className="absolute -top-1 -right-1 text-xs bg-cyan-500 text-white rounded-full px-1.5 py-0.5">{playerSkillCooldown}s</span>}
                  </button>
              </div>
              <div className="mt-3">
                <div className="text-xs text-gray-400">Player Energy: {playerEnergy}/100</div>
                <div className="w-full h-2.5 bg-white/10 rounded-full mt-1"><div className="h-full bg-purple-400 rounded-full" style={{ width: `${playerEnergy}%` }} /></div>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <h3 className="font-semibold text-gray-300 mb-2">Your Deck</h3>
              <div className="flex flex-col gap-2">{deck.map(c => <button key={c.id} onClick={() => handleSelectPlayerCard(c.id)} disabled={isAnimating || currentTurn !== 'player'} className={`w-full text-left px-3 py-1.5 rounded-md text-sm font-medium disabled:opacity-50 ${c.id === playerCard?.id ? "bg-indigo-500" : "bg-white/10"}`}>{c.name}</button>)}</div>
            </div>
        </div>

        {/* --- OPPONENT COLUMN --- */}
        <div className="order-4 lg:order-3 lg:col-span-3 space-y-4">
           <div className="bg-white/5 rounded-xl p-3">
              <h3 className="font-semibold text-gray-300 mb-2">Opponent Deck</h3>
              <div className="flex flex-col gap-2">{opponentOptions.map(c => 
                <button key={c.id} onClick={() => handleSelectOpponentCard(c.id)} className={`w-full text-left px-3 py-1.5 rounded-md text-sm font-medium ${c.id === opponentCard?.id ? "bg-rose-600" : "bg-white/10"}`}>
                  <span className="filter blur-sm select-none">{c.name}</span>
                </button>
              )}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
                 <div className="text-xs text-gray-400">Opponent Energy: {opponentEnergy}/100</div>
                 <div className="w-full h-2.5 bg-white/10 rounded-full mt-1"><div className="h-full bg-rose-400 rounded-full" style={{ width: `${opponentEnergy}%` }} /></div>
            </div>
            <div className="hidden lg:block bg-white/5 rounded-xl p-3 text-xs text-gray-300 space-y-1">
                <h3 className="font-semibold text-gray-200 mb-2">How to Play</h3>
                <p><strong className="text-red-400">Attack:</strong> Deals damage.</p>
                <p><strong className="text-green-400">Heal:</strong> Recovers HP. <strong className="text-cyan-400">{opponentHealCooldown > 0 ? `(Opponent CD: ${opponentHealCooldown}s)`: ''}</strong></p>
                <p><strong className="text-indigo-400">Skill:</strong> High damage, costs 40 Energy. <strong className="text-cyan-400">{opponentSkillCooldown > 0 ? `(Opponent CD: ${opponentSkillCooldown}s)`: ''}</strong></p>
             </div>
        </div>

        {/* --- MOBILE BATTLE LOG & HOW TO PLAY --- */}
        <div className="order-5 lg:hidden mt-4 w-full max-w-md mx-auto space-y-4">
             <div className="bg-white/5 rounded-xl p-3">
              <h3 className="font-semibold text-gray-300 mb-2 text-center">Battle Log</h3>
              <div className="text-xs text-gray-300 h-24 overflow-y-auto space-y-1 pr-2 text-center">{log.map((l, i) => <p key={i}>{l}</p>)}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-xs text-gray-300 space-y-1">
                <h3 className="font-semibold text-gray-200 mb-2">How to Play</h3>
                <p><strong className="text-red-400">Attack:</strong> Deals damage.</p>
                <p><strong className="text-green-400">Heal:</strong> Recovers HP. <strong className="text-cyan-400">{opponentHealCooldown > 0 ? `(Opponent CD: ${opponentHealCooldown}s)`: ''}</strong></p>
                <p><strong className="text-indigo-400">Skill:</strong> High damage, costs 40 Energy. <strong className="text-cyan-400">{opponentSkillCooldown > 0 ? `(Opponent CD: ${opponentSkillCooldown}s)`: ''}</strong></p>
             </div>
        </div>

      </div>
    );
  };


  return (
    <div className="min-h-full bg-[color:var(--accent1)] p-4 sm:p-6 text-gray-100 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-orbitron">JAGO Card Clash</h1>
          <p className="text-sm text-gray-400 mt-1">A mini-game by JAGO-HP AI</p>
        </div>
        {renderGameContent()}
      </div>
    </div>
  );
};

export default JCC;
