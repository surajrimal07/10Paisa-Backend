const context = {
    username: 'User',
    password: '********',
    phone: '1234567890',
    email: 'Undefined',
  };

const stockcontext = {
    isMarketOpen : false,
};

function setMarketStatus(isMarketOpen) {
    stockcontext.isMarketOpen = isMarketOpen;
}

function setUsername(username) {
    console.log("setUsername called with username: " + username);
context.username = username;
}

function setPassword(password) {
    context.password = password;
}

function setPhone(phone) {
    context.phone = phone;
}

function setEmail(email) {
    context.email = email;
}

export default { context, stockcontext, setMarketStatus, setUsername, setPassword, setPhone, setEmail };



