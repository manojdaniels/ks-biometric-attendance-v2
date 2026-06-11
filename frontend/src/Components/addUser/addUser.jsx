import * as React from 'react';
import "./addUser.css"
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { Box } from '@mui/material';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import TextField from '@mui/material/TextField';
import Upload from '../uploadfiles/upload';
import { createUser, uploadImages } from '../../api';

const initialValues = {
  name: '',
  email: '',
  phoneNumber: '',
  address: '',
  password: '',
  confirmPassword: ''
}

function AddUser() {
  const [open, setOpen] = React.useState(false);
  const [files, setFiles] = React.useState([]);
  const [formData, setFormData] = React.useState({ ...initialValues });
  const [error, setErrors] = React.useState({})
  const [loading, setLoading] = React.useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validationError = React.useCallback(() => {
    let errors = {};
    let isValid = true;

    if (!formData.name) { errors.name = "Name is required"; isValid = false; }
    if (!formData.email) { errors.email = "Email is required"; isValid = false; }
    else if (!/\S+@\S+\.\S+/.test(formData.email)) { errors.email = "Please Enter valid email"; isValid = false; }
    if (!formData.phoneNumber) { errors.phoneNumber = "Contact Number is required."; isValid = false; }
    else if (!/^[0-9]{10}$/.test(formData.phoneNumber)) { errors.phoneNumber = "Contact Number must be of 10 digits."; isValid = false; }
    if (!formData.address) { errors.address = "Address is required."; isValid = false; }
    if (!formData.password) { errors.password = "Password is required."; isValid = false; }
    else if (formData.password.length < 8) { errors.password = "Password must be at least 8 character long."; isValid = false; }
    if (!formData.confirmPassword) { errors.confirmPassword = "Confirm Password is required."; isValid = false; }
    if (formData.password !== formData.confirmPassword) { errors.confirmPassword = "Password Do not match"; isValid = false; }

    setErrors(errors);
    return isValid;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validationError()) return;

    setLoading(true);
    try {
      // 1️⃣ Create user
      const userPayload = {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        password: formData.password
      };

      const userResponse = await createUser(userPayload);
      // console.log("User created:", userResponse);

      // 2️⃣ Upload images only if files selected
      if (files.length > 0) {
        await uploadImages(files,formData.name); // waits for upload to finish
        // console.log("Images uploaded:", files.length);
      }

      // 3️⃣ Reset form & close
      setFormData({ ...initialValues });
      setFiles([]);
      setErrors({});
      handleClose();

    } catch (err) {
      // console.log("Error:", err.message || err);
      setErrors({ form: err.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  const isFormComplete = Object.values(formData).every(val => val.trim() !== '');

  return (
    <Box className="add-user-container">
      <Button onClick={handleClickOpen}>
        <AddIcon /> Add User
      </Button>
      <Dialog
        fullScreen={fullScreen}
        open={open}
        onClose={handleClose}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">ADD USER</DialogTitle>
        <DialogContent>
          <Box component='form' className="add-user-form" noValidate autoComplete="off" onSubmit={handleSubmit}>
            <Box className='user-field'>
              <TextField type='text' name="name" label="Name" value={formData.name} onChange={handleChange} error={!!error.name} helperText={error.name} />
              <TextField type='email' name='email' label="Email" value={formData.email} onChange={handleChange} error={!!error.email} helperText={error.email} />
            </Box>

            <Box className='user-field'>
              <TextField type='tel' name='phoneNumber' label="Contact Number" inputProps={{ maxLength: 10 }} value={formData.phoneNumber} onChange={handleChange} error={!!error.phoneNumber} helperText={error.phoneNumber} />
              <TextField type='text' name='address' label="Address" value={formData.address} onChange={handleChange} error={!!error.address} helperText={error.address} />
            </Box>

            <Box className='user-field'>
              <TextField type='password' name='password' label="Password" value={formData.password} onChange={handleChange} error={!!error.password} helperText={error.password} />
              <TextField type='password' name='confirmPassword' label="Confirm Password" value={formData.confirmPassword} onChange={handleChange} error={!!error.confirmPassword} helperText={error.confirmPassword} />
            </Box>

            <DialogActions>
              <Upload setFiles={setFiles} className='uploadbtn' />
              {files.length > 0 && <p>{files.length} images selected</p>}
              <Button autoFocus onClick={handleClose} className='user_btn cancel-btn'>Cancel</Button>
              <Button type='submit' autoFocus className='user_btn save-btn' disabled={loading || !isFormComplete}>
                {loading ? "Saving" : "Save"}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default AddUser;
