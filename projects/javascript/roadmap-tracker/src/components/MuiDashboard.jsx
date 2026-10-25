import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Paper
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

function MuiDashboard({ items, getItemProgress }) {
  // Статистика
  const stats = {
    total: items.length,
    completed: items.filter(item => getItemProgress(item.id).status === 'completed').length,
    inProgress: items.filter(item => getItemProgress(item.id).status === 'in-progress').length,
    notStarted: items.filter(item => {
      const status = getItemProgress(item.id).status;
      return status === 'not-started' || !status;
    }).length,
  };

  stats.progress = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  const StatCard = ({ title, value, color, icon: Icon }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={color}>
              {value}
            </Typography>
          </Box>
          <Icon sx={{ fontSize: 40, color: color, opacity: 0.7 }} />
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        📊 Панель управления
      </Typography>

      <Grid container spacing={3}>
        {/* Статистические карточки */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Всего технологий"
            value={stats.total}
            color="primary.main"
            icon={TrendingUpIcon}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Завершено"
            value={stats.completed}
            color="success.main"
            icon={CheckCircleIcon}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="В процессе"
            value={stats.inProgress}
            color="warning.main"
            icon={ScheduleIcon}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Не начато"
            value={stats.notStarted}
            color="text.secondary"
            icon={RadioButtonUncheckedIcon}
          />
        </Grid>

        {/* Прогресс-бар */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6">
                Общий прогресс
              </Typography>
              <Typography variant="h6" color="primary">
                {stats.progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={stats.progress}
              sx={{ 
                height: 12, 
                borderRadius: 6,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 6,
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                }
              }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default MuiDashboard;