import { useState } from 'react';
import { useRoadmap } from '../context/RoadmapContext';
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Box,
  Typography,
  Button,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon
} from '@mui/icons-material';
import { theme, darkTheme } from '../styles/theme';
import MuiTechCard from '../components/MuiTechCard';
import MuiDashboard from '../components/MuiDashboard';

function MuiPage() {
  const { 
    roadmap, 
    updateItemStatus, 
    getItemProgress,
    deleteItemNote 
  } = useRoadmap();
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const items = roadmap?.items || [];

  const handleStatusChange = (itemId, newStatus) => {
    updateItemStatus(itemId, newStatus);
    
    const statusMessages = {
      'completed': '✅ Технология отмечена как завершённая!',
      'in-progress': '🔄 Технология в процессе изучения',
      'not-started': '⏸️ Изучение приостановлено'
    };
    
    setSnackbar({
      open: true,
      message: statusMessages[newStatus],
      severity: newStatus === 'completed' ? 'success' : 'info'
    });
  };

  const handleEdit = (item) => {
    setSnackbar({
      open: true,
      message: `Редактирование "${item.title}" (откройте страницу технологии)`,
      severity: 'info'
    });
  };

  const handleDelete = (itemId) => {
    // В текущем контексте нет удаления items, только заметок
    deleteItemNote(itemId);
    setSnackbar({
      open: true,
      message: 'Заметка удалена',
      severity: 'warning'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const currentTheme = isDarkMode ? darkTheme : theme;

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        {/* Шапка */}
        <AppBar position="static" elevation={2}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              🎨 Material-UI Demo
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={isDarkMode}
                  onChange={() => setIsDarkMode(!isDarkMode)}
                  color="default"
                />
              }
              label={isDarkMode ? <DarkModeIcon /> : <LightModeIcon />}
            />
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Дашборд */}
          <MuiDashboard items={items} getItemProgress={getItemProgress} />

          {/* Заголовок секции */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">
              📚 Технологии ({items.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              Добавить
            </Button>
          </Box>

          {/* Сетка карточек */}
          {items.length > 0 ? (
            <Grid container spacing={3}>
              {items.map(item => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                  <MuiTechCard
                    item={item}
                    progress={getItemProgress(item.id)}
                    onStatusChange={handleStatusChange}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box textAlign="center" py={8}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Технологий пока нет
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Импортируйте roadmap или добавьте технологии
              </Typography>
            </Box>
          )}
        </Container>

        {/* Уведомления */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default MuiPage;