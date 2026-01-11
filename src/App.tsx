import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Stack, 
  Chip,
  Fade,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Select,
  MenuItem,
  FormControl,
  Tabs,
  Tab,
  IconButton,
  TextField
} from '@mui/material';
import { 
  CheckCircle, 
  Cancel, 
  Refresh, 
  Casino, 
  HelpOutline,
  Language,
  Spa,
  Circle
} from '@mui/icons-material';

// --- Types ---
type OutcomeType = 'good' | 'bad' | 'retry';
type Tier = 'basic' | 'advanced' | 'hard';
type Lang = 'en' | 'ru';
type TabType = 'minigame' | 'dice';

interface Token {
  id: string;
  type: OutcomeType;
  tier: Tier;
  revealed: boolean;
}

interface GameState {
  round: number;
  successes: number;
  tokens: Token[];
  history: (OutcomeType | null)[];
  phase: 'input' | 'playing' | 'summary' | 'end';
  peek: boolean;
}

interface DiceState {
  stats: number;
  skills: number;
  bonuses: number;
  lastRolls: number[];
  totalSuccesses: number | null;
}

// --- Translations ---
const translations = {
  en: {
    title: 'RPG RESOLUTION',
    round: 'ROUND',
    complete: 'COMPLETE',
    rollTitle: 'Roll Dice',
    rollDesc: 'Enter the number of successes rolled (0-3)',
    successes: 'Successes',
    reveal: 'Reveal Board',
    victory: 'VICTORY',
    defeat: 'DEFEAT',
    newGame: 'New Game',
    continue: 'Continue',
    unknown: 'UNKNOWN TOKEN',
    basic: 'basic',
    advanced: 'advanced',
    hard: 'hard',
    good: 'Success',
    bad: 'Failure',
    retry: 'Retry',
    tabMinigame: 'Minigame',
    tabDice: 'Dice Thrower',
    stats: 'Stats',
    skills: 'Skills',
    bonuses: 'Bonuses',
    totalDice: 'Total Dice Pool',
    roll: 'ROLL DICE',
    rollResults: 'Roll Results',
    rollOutcome: 'Outcome',
    outcomeFail: 'Failure',
    outcomeSuccess: 'Success',
    outcomeExceptional: 'Exceptional Success',
  },
  ru: {
    title: 'Проверка навыков',
    round: 'РАУНД',
    complete: 'ЗАВЕРШЕНО',
    rollTitle: 'Бросок кубиков',
    rollDesc: 'Введите количество успехов (0-3)',
    successes: 'Успехи',
    reveal: 'Открыть доску',
    victory: 'ПОБЕДА',
    defeat: 'ПОРАЖЕНИЕ',
    newGame: 'Новая игра',
    continue: 'Продолжить',
    unknown: 'НЕИЗВЕСТНО',
    basic: 'базовый',
    advanced: 'продвинутый',
    hard: 'сложный',
    good: 'Успех',
    bad: 'Провал',
    retry: 'Переброс',
    tabMinigame: 'Мини-игра',
    tabDice: 'Бросок кубиков',
    stats: 'Характеристики',
    skills: 'Навыки',
    bonuses: 'Бонусы',
    totalDice: 'Всего кубиков',
    roll: 'БРОСОК',
    rollResults: 'Результаты',
    rollOutcome: 'Итог',
    outcomeFail: 'Провал',
    outcomeSuccess: 'Успех',
    outcomeExceptional: 'Исключительный успех',
  }
};

// --- Theme ---
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#4caf50' }, // Forest Green
    secondary: { main: '#8bc34a' },
    background: { 
      default: '#0d1a0d', 
      paper: '#1a2e1a'
    },
    success: { main: '#a2ffaf' },
    error: { main: '#ff8a80' },
    warning: { main: '#fff59d' },
    divider: 'rgba(76, 175, 80, 0.2)',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          color: 'rgba(255, 255, 255, 0.6)',
          '&.Mui-selected': { color: '#a2ffaf' },
        },
      },
    },
  },
});

// --- Helper Functions ---
const generateTokens = (successes: number): Token[] => {
  const basic: { type: OutcomeType; tier: Tier }[] = [
    { type: 'good', tier: 'basic' },
    { type: 'bad', tier: 'basic' },
    { type: 'retry', tier: 'basic' },
    { type: 'retry', tier: 'basic' },
  ];
  const advanced: { type: OutcomeType; tier: Tier }[] = [
    { type: 'good', tier: 'advanced' },
    { type: 'good', tier: 'advanced' },
    { type: 'bad', tier: 'advanced' },
    { type: 'bad', tier: 'advanced' },
  ];
  const hard: { type: OutcomeType; tier: Tier }[] = [
    { type: 'good', tier: 'hard' },
    { type: 'bad', tier: 'hard' },
  ];

  const removeAdvanced = Math.min(successes, 2);
  const removeHard = Math.max(0, successes - 2);

  const filterBad = (pool: typeof advanced, count: number) => {
    let removed = 0;
    return pool.filter(t => {
      if (t.type === 'bad' && removed < count) {
        removed++;
        return false;
      }
      return true;
    });
  };

  return [
    ...basic,
    ...filterBad(advanced, removeAdvanced),
    ...filterBad(hard, removeHard),
  ]
    .map((t, i) => ({ ...t, id: `token-${Date.now()}-${i}`, revealed: false }))
    .sort(() => Math.random() - 0.5);
};

const outcomeColors: Record<OutcomeType, string> = {
  good: 'success.main',
  bad: 'error.main',
  retry: 'warning.main'
};

// --- Star Rating Component ---
const StarRating = ({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void;
}) => {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.light', minWidth: 100 }}>
        {label}
      </Typography>
      <Box display="flex" gap={0.5}>
        {[1, 2, 3, 4, 5].map((star) => (
          <IconButton
            key={star}
            onClick={() => onChange(star === value ? 0 : star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(null)}
            sx={{ p: 0.5 }}
          >
            <Circle 
              sx={{ 
                fontSize: 28,
                color: (hover !== null ? star <= hover : star <= value) 
                  ? 'primary.main' 
                  : 'rgba(76, 175, 80, 0.2)',
                transition: 'color 0.2s',
                filter: (hover !== null ? star <= hover : star <= value) ? 'drop-shadow(0 0 4px rgba(76,175,80,0.6))' : 'none'
              }} 
            />
          </IconButton>
        ))}
      </Box>
    </Box>
  );
};

export default function App() {
  const [lang, setLang] = useState<Lang>('en');
  const [tab, setTab] = useState<TabType>('minigame');
  
  // Game States
  const [gameState, setGameState] = useState<GameState>({
    round: 0, successes: 0, tokens: [], history: [null, null, null], phase: 'input', peek: false
  });
  
  const [diceState, setDiceState] = useState<DiceState>({
    stats: 0, skills: 0, bonuses: 0, lastRolls: [], totalSuccesses: null
  });

  const txt = translations[lang];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && tab === 'minigame') setGameState(p => ({ ...p, peek: true }));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && tab === 'minigame') setGameState(p => ({ ...p, peek: false }));
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [tab]);

  // --- Handlers ---
  const handleStartRound = () => setGameState(prev => ({ ...prev, phase: 'playing', tokens: generateTokens(prev.successes) }));
  
  const handleTokenClick = (id: string) => {
    setGameState(prev => {
      const clickedToken = prev.tokens.find(t => t.id === id);
      if (!clickedToken || clickedToken.revealed) return prev;
      const newTokens = prev.tokens.map(t => t.id === id ? { ...t, revealed: true } : t);
      if (clickedToken.type === 'retry') return { ...prev, tokens: newTokens };
      const newHistory = [...prev.history];
      newHistory[prev.round] = clickedToken.type;
      return { ...prev, tokens: newTokens, history: newHistory, phase: 'summary' };
    });
  };

  const handleNextPhase = () => {
    setGameState(prev => {
      const isGameOver = prev.round >= 2;
      return { ...prev, phase: isGameOver ? 'end' : 'input', round: isGameOver ? prev.round : prev.round + 1, successes: 0, peek: false };
    });
  };

  const handleResetGame = () => setGameState({ round: 0, successes: 0, tokens: [], history: [null, null, null], phase: 'input', peek: false });

  const rollDice = () => {
    const totalDice = diceState.stats + diceState.skills + diceState.bonuses;
    if (totalDice === 0) return;
    let currentSuccesses = 0;
    let rolls: number[] = [];
    
    const performRolls = (count: number) => {
      let newTens = 0;
      for (let i = 0; i < count; i++) {
        const result = Math.floor(Math.random() * 10) + 1;
        rolls.push(result);
        if (result >= 8) currentSuccesses++;
        if (result === 10) newTens++;
      }
      if (newTens > 0) performRolls(newTens);
    };
    performRolls(totalDice);
    setDiceState(prev => ({ ...prev, lastRolls: rolls, totalSuccesses: currentSuccesses }));
  };

  const getDiceOutcome = (successes: number | null) => {
    if (successes === null) return '';
    if (successes === 0) return txt.outcomeFail;
    if (successes >= 5) return txt.outcomeExceptional;
    return txt.outcomeSuccess;
  };

  const getDiceOutcomeColor = (successes: number | null) => {
    if (successes === null) return 'text.primary';
    if (successes === 0) return 'error.main';
    if (successes >= 5) return 'success.light';
    return 'success.main';
  };

  const getIcon = (type: OutcomeType) => 
    type === 'good' ? <CheckCircle color="success" /> :
    type === 'bad' ? <Cancel color="error" /> : <Refresh color="warning" />;

  const isInput = gameState.phase === 'input';
  const isEnd = gameState.phase === 'end';
  const isSummary = gameState.phase === 'summary';
  const isPlaying = gameState.phase === 'playing';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 3 }}>
        <Paper elevation={12} sx={{ width: '100%', maxWidth: '1000px', minWidth: { md: '1000px' }, minHeight: '80vh', p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'background.paper', border: '1px solid rgba(76, 175, 80, 0.3)', position: 'relative' }}>
          
          {/* Header */}
          <Stack spacing={3} width="100%" alignItems="center" mb={4}>
            <Stack direction="row" alignItems="center" spacing={2}>
               <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spa sx={{ fontSize: 60, color: 'primary.main', opacity: 0.8 }} />
              </Box>
              <Typography variant="h3" fontWeight="900" textAlign="center" sx={{ color: 'primary.light', letterSpacing: 1 }}>
                {txt.title}
              </Typography>
            </Stack>
            
            <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="primary" indicatorColor="primary" sx={{ borderBottom: 1, borderColor: 'divider', width: '100%', maxWidth: 600 }} variant="fullWidth">
              <Tab label={txt.tabMinigame} value="minigame" />
              <Tab label={txt.tabDice} value="dice" />
            </Tabs>
          </Stack>

          {/* TAB: MINIGAME */}
          {tab === 'minigame' && (
            <Fade in key="minigame">
              <Stack spacing={5} width="100%" maxWidth="700px" alignItems="center">
                <Chip label={isEnd ? txt.complete : `${txt.round} ${gameState.round + 1} / 3`} color="primary" variant="outlined" sx={{ fontSize: '1.2rem', py: 2.5, px: 3, fontWeight: 'bold' }} />
                <Stack direction="row" spacing={3} justifyContent="center">
                  {gameState.history.map((res, i) => (
                    <Paper key={i} sx={{ width: 70, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.2)', borderColor: (i === gameState.round && !isEnd) ? 'primary.main' : 'divider', borderWidth: (i === gameState.round && !isEnd) ? 4 : 1, borderStyle: 'solid', borderRadius: 3 }}>
                      {res ? <Box sx={{ transform: 'scale(1.5)' }}>{getIcon(res)}</Box> : <Typography variant="h5" color="text.disabled">{i + 1}</Typography>}
                    </Paper>
                  ))}
                </Stack>
                <Box width="100%">
                  {isInput ? (
                    <Paper sx={{ p: 5, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.1)', border: '1px dashed #4caf50' }}>
                      <Casino sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
                      <Typography variant="h5" gutterBottom fontWeight="bold">{txt.rollTitle}</Typography>
                      <TextField type="number" fullWidth label={txt.successes} value={gameState.successes} onChange={(e) => { const val = parseInt(e.target.value) || 0; setGameState(p => ({ ...p, successes: Math.min(Math.max(val, 0), 3) })); }} sx={{ mb: 4, mt: 2, '& .MuiFilledInput-root': { bgcolor: 'background.default' } }} variant="filled" inputProps={{ min: 0, max: 3 }} />
                      <Button variant="contained" fullWidth size="large" onClick={handleStartRound} sx={{ py: 1.5, fontSize: '1.1rem', bgcolor: 'primary.dark' }}>{txt.reveal}</Button>
                    </Paper>
                  ) : isEnd ? (
                    <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.2)' }}>
                      <Typography variant="h2" gutterBottom fontWeight="900" color={gameState.history.filter(h => h === 'good').length >= 2 ? 'success.main' : 'error.main'}>{gameState.history.filter(h => h === 'good').length >= 2 ? txt.victory : txt.defeat}</Typography>
                      <Button variant="outlined" color="primary" size="large" onClick={handleResetGame} sx={{ mt: 3 }}>{txt.newGame}</Button>
                    </Paper>
                  ) : (
                    <Stack spacing={2}>
                      {gameState.tokens.map((token) => {
                        const isVisible = token.revealed || (gameState.peek && isPlaying);
                        return (
                          <Fade in key={token.id}>
                            <Paper onClick={() => !isSummary && !token.revealed && handleTokenClick(token.id)} sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: (token.revealed || isSummary) ? 'default' : 'pointer', bgcolor: isVisible ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)', borderColor: isVisible ? outcomeColors[token.type] : 'rgba(76, 175, 80, 0.2)', borderWidth: 2, borderStyle: 'solid', transition: 'all 0.2s', '&:hover': { bgcolor: (!isVisible && !isSummary) ? 'rgba(76, 175, 80, 0.1)' : undefined, transform: (!isVisible && !isSummary) ? 'translateY(-2px)' : undefined } }}>
                              <Box display="flex" alignItems="center" gap={3}>
                                {isVisible ? getIcon(token.type) : <HelpOutline sx={{ color: 'rgba(76, 175, 80, 0.4)', fontSize: 32 }} />}
                                <Typography variant="h6" sx={{ color: isVisible ? outcomeColors[token.type] : 'text.primary', fontWeight: isVisible ? 'bold' : '500' }}>{isVisible ? txt[token.type] : txt.unknown}</Typography>
                              </Box>
                              {isVisible && <Chip label={txt[token.tier]} variant="filled" color={token.type === 'good' ? 'success' : token.type === 'bad' ? 'error' : 'warning'} size="small" />}
                            </Paper>
                          </Fade>
                        );
                      })}
                      {isSummary && <Button variant="contained" color="primary" size="large" fullWidth onClick={handleNextPhase} sx={{ py: 2, mt: 2, fontSize: '1.2rem' }}>{txt.continue}</Button>}
                    </Stack>
                  )}
                </Box>
              </Stack>
            </Fade>
          )}

          {/* TAB: DICE THROWER (Single Column Refactor) */}
          {tab === 'dice' && (
            <Fade in key="dice">
              <Stack spacing={4} width="100%" maxWidth="550px" alignItems="center">
                
                {/* Inputs Area */}
                <Paper sx={{ p: 4, width: '100%', bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 4, border: '1px solid rgba(76, 175, 80, 0.1)' }}>
                  <Stack spacing={3}>
                    <StarRating label={txt.stats} value={diceState.stats} onChange={(val) => setDiceState(p => ({ ...p, stats: val }))} />
                    <StarRating label={txt.skills} value={diceState.skills} onChange={(val) => setDiceState(p => ({ ...p, skills: val }))} />
                    <StarRating label={txt.bonuses} value={diceState.bonuses} onChange={(val) => setDiceState(p => ({ ...p, bonuses: val }))} />
                  </Stack>
                </Paper>

                {/* Roll Action Area */}
                <Stack spacing={2} width="100%" alignItems="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.7 }}>
                    <Typography variant="h6">{txt.totalDice}:</Typography>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {diceState.stats + diceState.skills + diceState.bonuses}
                    </Typography>
                  </Box>
                  
                  <Button 
                    variant="contained" 
                    size="large" 
                    fullWidth
                    onClick={rollDice}
                    disabled={(diceState.stats + diceState.skills + diceState.bonuses) === 0}
                    sx={{ 
                      py: 2, 
                      fontSize: '1.3rem', 
                      borderRadius: 3,
                      bgcolor: 'primary.dark',
                      fontWeight: 'bold',
                      boxShadow: '0 0 15px rgba(76, 175, 80, 0.3)',
                      '&:hover': { bgcolor: 'primary.main', boxShadow: '0 0 20px rgba(76, 175, 80, 0.5)' }
                    }}
                  >
                    {txt.roll}
                  </Button>
                </Stack>

                {/* Results Area */}
                {diceState.totalSuccesses !== null && (
                  <Fade in>
                    <Paper 
                      sx={{ 
                        p: 3, 
                        width: '100%', 
                        bgcolor: 'rgba(255,255,255,0.05)', 
                        textAlign: 'center',
                        borderTop: '2px solid',
                        borderColor: getDiceOutcomeColor(diceState.totalSuccesses)
                      }}
                    >
                      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
                        {txt.rollResults}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', my: 2 }}>
                        {diceState.lastRolls.map((roll, idx) => (
                          <Chip 
                            key={idx} 
                            label={roll} 
                            color={roll === 10 ? 'success' : roll >= 8 ? 'primary' : 'default'}
                            variant={roll >= 8 ? 'filled' : 'outlined'}
                            sx={{ fontWeight: 'bold', minWidth: 32 }}
                          />
                        ))}
                      </Box>
                      
                      <Typography variant="h4" fontWeight="900" color={getDiceOutcomeColor(diceState.totalSuccesses)} sx={{ mt: 1 }}>
                        {getDiceOutcome(diceState.totalSuccesses)}
                      </Typography>
                      <Typography variant="h6" color="text.secondary">
                        {diceState.totalSuccesses} {txt.successes}
                      </Typography>
                    </Paper>
                  </Fade>
                )}
              </Stack>
            </Fade>
          )}

          {/* Footer */}
          <Box sx={{ position: 'absolute', bottom: 24, right: 32 }}>
            <FormControl size="small" variant="outlined">
              <Select value={lang} onChange={(e) => setLang(e.target.value as Lang)} startAdornment={<Language sx={{ mr: 1 }} />} sx={{ bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2 }}>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="ru">Русский</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}