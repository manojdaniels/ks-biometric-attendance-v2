import React, { useState } from 'react';
import { Button, Snackbar, Alert } from '@mui/material';
import DoNotDisturbOnTotalSilenceIcon from '@mui/icons-material/DoNotDisturbOnTotalSilence';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { updateStatus } from '../../api';

const Status = ({ id, initialStatus, onStatusChange }) => {
  const [isActive, setIsActive] = useState(initialStatus ?? false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleStatusToggle = async () => {
    setLoading(true);
    const newStatus = !isActive;

    try {
      const result = await updateStatus(id, newStatus);

      if (result?.isActive !== undefined) {
        setIsActive(result.isActive);
        if (onStatusChange) onStatusChange(result.isActive);

        setSnackbar({
          open: true,
          message: `User ${result.isActive ? 'activated' : 'deactivated'} successfully.`,
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: result?.message || 'Status update failed',
          severity: 'error',
        });
      }
    } catch {
      setSnackbar({
        open: true,
        message: 'Status toggle failed',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        onClick={handleStatusToggle}
        disabled={loading}
        sx={{
          backgroundColor: isActive ? 'green' : 'red',
          color: 'white',
          '&:hover': {
            backgroundColor: isActive ? 'darkgreen' : 'darkred',
          },
        }}
        startIcon={isActive ? <TaskAltIcon /> : <DoNotDisturbOnTotalSilenceIcon />}
      >
        {loading ? 'Updating...' : isActive ? 'Activated' : 'Deactivated'}
      </Button>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Status;
