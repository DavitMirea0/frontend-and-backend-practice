import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';

function MuiTechCard({ item, progress, onStatusChange, onEdit, onDelete }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Завершено';
      case 'in-progress': return 'В процессе';
      default: return 'Не начато';
    }
  };

  const status = progress?.status || 'not-started';

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            {item.title}
          </Typography>
          <Chip
            label={getStatusText(status)}
            color={getStatusColor(status)}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {item.description || 'Нет описания'}
        </Typography>

        {/* Ресурсы */}
        {item.resources && item.resources.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
            {item.resources.slice(0, 2).map((url, idx) => (
              <Chip
                key={idx}
                label={`Ресурс ${idx + 1}`}
                size="small"
                variant="outlined"
                icon={<OpenInNewIcon />}
                onClick={() => window.open(url, '_blank')}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        )}

        {/* Заметка */}
        {progress?.note && (
          <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
            📝 {progress.note}
          </Typography>
        )}

        {/* Дедлайн */}
        {progress?.deadline && (
          <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
            📅 Дедлайн: {new Date(progress.deadline).toLocaleDateString('ru-RU')}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box>
          {status !== 'completed' && (
            <Tooltip title="Завершить">
              <IconButton
                color="success"
                onClick={() => onStatusChange(item.id, 'completed')}
                size="small"
              >
                <CheckCircleIcon />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={status === 'in-progress' ? 'Приостановить' : 'Начать'}>
            <IconButton
              color={status === 'in-progress' ? 'warning' : 'primary'}
              onClick={() => onStatusChange(
                item.id,
                status === 'in-progress' ? 'not-started' : 'in-progress'
              )}
              size="small"
            >
              {status === 'in-progress' ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        <Box>
          <Tooltip title="Редактировать">
            <IconButton onClick={() => onEdit(item)} size="small">
              <EditIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Удалить">
            <IconButton 
              color="error" 
              onClick={() => onDelete(item.id)}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
}

export default MuiTechCard;