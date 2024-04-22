import fs from 'fs';

export const validatePhoneNumber = (phone) => {
    const phoneString = String(phone);
    if (phoneString.length === 10) {
        return true;
    } else {
        return false;
    }
};


export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    return true;
  };

  //security measures 1
  export const validatePassword = (password) => {
    if (password.length < 8) {
        return "Password should be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
        return "Password should contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
        return "Password should contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
        return "Password should contain at least one number";
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return "Password should contain at least one special character";
    }
    if (/(\w)\1{2,}/.test(password)) {
        return "Password should not contain repeating characters more than twice";
    }
    if (/\s/.test(password)) {
        return "Password should not contain spaces";
    }
    return true; // Password meets all criteria
}

//security measures 2 -- check if password contains name or email
export const NameorEmailinPassword = (name, email, password) => {
    name = String(name);
    email = String(email);
    password = String(password);

    if (password.toLowerCase().includes(name.toLowerCase()) || password.toLowerCase().includes(email.toLowerCase())) {
        return false;
    }
    return true;
};

//security measures 3 -- LDA check
export const LDAcheck = (password) => {
  const commonPasswords = fs.readFileSync('passworddatabase.txt', 'utf8').split('\n');

  for (const commonPassword of commonPasswords) {
      if (calculateSimilarity(password.toLowerCase(), commonPassword) > 0.5) {
          return false;
      }
  }

  return true;
};

const calculateSimilarity = (password, commonPassword) => {
  const distance = levenshteinDistance(password, commonPassword);
  const maxLength = Math.max(password.length, commonPassword.length);
  const similarityScore = 1 - distance / maxLength;

  return similarityScore;
};

const levenshteinDistance = (s1, s2) => {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from(Array(m + 1), () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) {
      dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
          if (s1[i - 1] === s2[j - 1]) {
              dp[i][j] = dp[i - 1][j - 1];
          } else {
              dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
          }
      }
  }

  return dp[m][n];
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
