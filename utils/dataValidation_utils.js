export const validatePhoneNumber = (phone) => {
    if (phone.length == 10 && !isNaN(phone)) {
        return true;
    }
    return false;
  };

export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    return true;
  };

export const validatePassword = (password) => {
    if (password.length < 6) {
      return false;
    }
    return true;
  };

export const validateName = (name) => {
    const nameParts = String(name).trim().split(' ');

    const joinedName = nameParts.join(' ');
    const isValidName = /^[a-zA-Z\s]+$/.test(joinedName);
    const isValidLength = nameParts.length >= 2;
    return isValidName && isValidLength;
  };

export const isempty = (data) => {
    if (data.length === 0) {
      return false;
    }
    return true;
}
