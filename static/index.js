document.getElementById("request-button").addEventListener('click', () => {
    fetch('http://localhost:3000/altinn-meldinger-client/api/protected')
        .then(res => document.getElementById("result").innerText = res.status || 'error!')
})
