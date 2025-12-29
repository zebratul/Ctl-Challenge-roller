import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
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
  FormControl
} from '@mui/material';
import { 
  CheckCircle, 
  Cancel, 
  Refresh, 
  Casino, 
  HelpOutline,
  Language,
  Spa
} from '@mui/icons-material';

type OutcomeType = 'good' | 'bad' | 'retry';
type Tier = 'basic' | 'advanced' | 'hard';
type Lang = 'en' | 'ru';

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
    retry: 'Retry'
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
    retry: 'Переброс'
  }
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#4caf50' }, // Forest Green
    secondary: { main: '#8bc34a' },
    background: { 
      default: '#0d1a0d', // Deep Forest Black/Green
      paper: '#1a2e1a'    // Dark Moss Green
    },
    success: { main: '#a2ffaf' },
    error: { main: '#ff8a80' },
    warning: { main: '#fff59d' },
    divider: 'rgba(76, 175, 80, 0.2)',
  },
  shape: { borderRadius: 12 },
});

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

export default function App() {
  const [lang, setLang] = useState<Lang>('en');
  const [state, setState] = useState<GameState>({
    round: 0,
    successes: 0,
    tokens: [],
    history: [null, null, null],
    phase: 'input',
    peek: false
  });

  const txt = translations[lang];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) setState(p => ({ ...p, peek: true }));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setState(p => ({ ...p, peek: false }));
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleStartRound = () => {
    setState(prev => ({
      ...prev,
      phase: 'playing',
      tokens: generateTokens(prev.successes)
    }));
  };

  const handleTokenClick = (id: string) => {
    setState(prev => {
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
    setState(prev => {
      const isGameOver = prev.round >= 2;
      return {
        ...prev,
        phase: isGameOver ? 'end' : 'input',
        round: isGameOver ? prev.round : prev.round + 1,
        successes: 0,
        peek: false
      };
    });
  };

  const handleReset = () => {
    setState({ round: 0, successes: 0, tokens: [], history: [null, null, null], phase: 'input', peek: false });
  };

  const getIcon = (type: OutcomeType) => 
    type === 'good' ? <CheckCircle color="success" /> :
    type === 'bad' ? <Cancel color="error" /> :
    <Refresh color="warning" />;

  const isInput = state.phase === 'input';
  const isEnd = state.phase === 'end';
  const isSummary = state.phase === 'summary';
  const isPlaying = state.phase === 'playing';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box 
        sx={{ 
          minHeight: '100vh', 
          width: '100vw',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 3
        }}
      >
        <Paper 
          elevation={12}
          sx={{
            width: '100%',
            maxWidth: '1000px',
            minWidth: { md: '1000px' },
            minHeight: '75vh',
            p: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: 'background.paper',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            position: 'relative'
          }}
        >
          <Stack spacing={5} width="100%" maxWidth="700px">
            {/* Header with Custom Icon */}
            <Stack spacing={2} alignItems="center">
              <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spa sx={{ fontSize: 80, color: 'primary.main', opacity: 0.8 }} />
                {/* Visual "thorn ring" effect using a box shadow or overlay if needed */}
              </Box>
              <Typography variant="h2" fontWeight="900" textAlign="center" sx={{ color: 'primary.light' }}>
                {txt.title}
              </Typography>
              <Chip 
                label={isEnd ? txt.complete : `${txt.round} ${state.round + 1} / 3`} 
                color="primary"
                variant="outlined"
                sx={{ fontSize: '1.4rem', py: 3, px: 3, fontWeight: 'bold' }}
              />
            </Stack>

            {/* History Tracker */}
            <Stack direction="row" spacing={3} justifyContent="center">
              {state.history.map((res, i) => (
                <Paper 
                  key={i} 
                  sx={{ 
                    width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: 'rgba(0,0,0,0.2)',
                    borderColor: (i === state.round && !isEnd) ? 'primary.main' : 'divider',
                    borderWidth: (i === state.round && !isEnd) ? 4 : 1,
                    borderStyle: 'solid',
                  }}
                >
                  {res ? (
                    <Box sx={{ transform: 'scale(1.5)' }}>{getIcon(res)}</Box>
                  ) : (
                    <Typography variant="h5" color="text.disabled">{i + 1}</Typography>
                  )}
                </Paper>
              ))}
            </Stack>

            <Box flex={1}>
              {isInput ? (
                <Fade in>
                  <Paper sx={{ p: 5, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.1)', border: '1px dashed #4caf50' }}>
                    <Casino sx={{ fontSize: 80, mb: 2, color: 'primary.main' }} />
                    <Typography variant="h4" gutterBottom fontWeight="bold">{txt.rollTitle}</Typography>
                    <TextField
                      type="number"
                      fullWidth
                      label={txt.successes}
                      value={state.successes}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setState(p => ({ ...p, successes: Math.min(Math.max(val, 0), 3) }));
                      }}
                      sx={{ mb: 4, '& .MuiFilledInput-root': { bgcolor: 'background.default' } }}
                      variant="filled"
                    />
                    <Button 
                      variant="contained" 
                      fullWidth 
                      size="large" 
                      onClick={handleStartRound}
                      sx={{ py: 2, fontSize: '1.3rem', bgcolor: 'primary.dark', '&:hover': { bgcolor: 'primary.main' } }}
                    >
                      {txt.reveal}
                    </Button>
                  </Paper>
                </Fade>
              ) : isEnd ? (
                <Fade in>
                  <Paper sx={{ p: 8, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.2)' }}>
                    <Typography variant="h1" gutterBottom fontWeight="900" color={state.history.filter(h => h === 'good').length >= 2 ? 'success.main' : 'error.main'}>
                      {state.history.filter(h => h === 'good').length >= 2 ? txt.victory : txt.defeat}
                    </Typography>
                    <Button variant="outlined" color="primary" size="large" onClick={handleReset} sx={{ mt: 4 }}>
                      {txt.newGame}
                    </Button>
                  </Paper>
                </Fade>
              ) : (
                <Stack spacing={2}>
                  {state.tokens.map((token) => {
                    const isVisible = token.revealed || (state.peek && isPlaying);
                    return (
                      <Fade in key={token.id}>
                        <Paper
                          onClick={() => !isSummary && !token.revealed && handleTokenClick(token.id)}
                          sx={{
                            p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            cursor: (token.revealed || isSummary) ? 'default' : 'pointer',
                            bgcolor: isVisible ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)',
                            borderColor: isVisible ? outcomeColors[token.type] : 'rgba(76, 175, 80, 0.2)',
                            borderWidth: 2, borderStyle: 'solid',
                            '&:hover': { bgcolor: (!isVisible && !isSummary) ? 'rgba(76, 175, 80, 0.1)' : undefined }
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={3}>
                            {isVisible ? getIcon(token.type) : <HelpOutline sx={{ color: 'rgba(76, 175, 80, 0.4)', fontSize: 32 }} />}
                            <Typography variant="h5" sx={{ color: isVisible ? outcomeColors[token.type] : 'text.primary', fontWeight: isVisible ? 'bold' : '500' }}>
                              {isVisible ? txt[token.type] : txt.unknown}
                            </Typography>
                          </Box>
                          {isVisible && <Chip label={txt[token.tier]} variant="filled" color={token.type === 'good' ? 'success' : token.type === 'bad' ? 'error' : 'warning'} size="small" />}
                        </Paper>
                      </Fade>
                    );
                  })}
                  {isSummary && (
                    <Button variant="contained" color="primary" size="large" fullWidth onClick={handleNextPhase} sx={{ py: 2.5, mt: 2, fontSize: '1.4rem' }}>
                      {txt.continue}
                    </Button>
                  )}
                </Stack>
              )}
            </Box>
          </Stack>

          {/* Language Selector */}
          <Box sx={{ mt: 6, alignSelf: 'flex-end' }}>
            <FormControl size="small" variant="outlined">
              <Select value={lang} onChange={(e) => setLang(e.target.value as Lang)} startAdornment={<Language sx={{ mr: 1 }} />}>
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