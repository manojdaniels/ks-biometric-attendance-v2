import * as React from 'react';
import { Box, Typography, TextField, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useParams } from "react-router-dom";
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import { addCamera } from '../../api';
import "./addCamera.css";

export default function ResponsiveDialog() {
  const { id } = useParams();
  const [open, setOpen] = React.useState(false);
  const [formValues, setFormValues] = React.useState({
    location: '',
    entryCamera: '',
    exitCamera: ''
  });
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const handleClickOpen = () => {
    setOpen(true);
    setError('');
    setSuccess('');
    setFormValues({ location: '', entryCamera: '', exitCamera: '' });
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formValues.location || !formValues.entryCamera || !formValues.exitCamera) {
      setError('Please fill all fields');
      setLoading(false);
      return;
    }

    try {
      const payload = {
  location: formValues.location,
  entryCamera: { rtspUrl: formValues.entryCamera },
  exitCamera: { rtspUrl: formValues.exitCamera }
};


      const response = await addCamera(id, payload);
      
      if (response.message) {
        setSuccess('Cameras added successfully!');
        setTimeout(() => {
          setOpen(false);
          setFormValues({ location: '', entryCamera: '', exitCamera: '' });
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add cameras');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className='add-camera-container'>
      <Button 
        onClick={handleClickOpen} 
        startIcon={<AddIcon />} 
        className='camera_btn'
        variant="contained"
      >
        Add Camera
      </Button>
      
      <Dialog
        fullScreen={fullScreen}
        open={open}
        onClose={handleClose}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">
          ADD CAMERAS
        </DialogTitle>
        
        <DialogContent>
          <Box className='add-camera'>
            <Box className='add-camera-input' mb={2}>
              <TextField
                fullWidth
                label='Location'
                name='location'
                size='small'
                placeholder='e.g., Library Entrance'
                value={formValues.location}
                onChange={handleInputChange}
              />
            </Box>

            <Box className='add-camera-input' mb={2}>
              <TextField
                fullWidth
                label='Entry Camera RTSP URL'
                name='entryCamera'
                size='small'
                placeholder='rtsp://username:password@ip_address:port/stream'
                value={formValues.entryCamera}
                onChange={handleInputChange}
              />
            </Box>

            <Box className='add-camera-input' mb={2}>
              <TextField
                fullWidth
                label='Exit Camera RTSP URL'
                name='exitCamera'
                size='small'
                placeholder='rtsp://username:password@ip_address:port/stream'
                value={formValues.exitCamera}
                onChange={handleInputChange}
              />
            </Box>

            {error && (
              <Typography color="error" variant="body2" mt={1}>
                {error}
              </Typography>
            )}
            {success && (
              <Typography color="success.main" variant="body2" mt={1}>
                {success}
              </Typography>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleClose} 
            disabled={loading}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            variant="contained"
            color="primary"
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}