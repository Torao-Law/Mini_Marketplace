const myEmail = "martin@mail.com"

function getData() {
    let name = document.getElementById("name").value
    let email = document.getElementById('email').value
    let telp = document.getElementById('telp').value
    let subjectForm = document.getElementById('subject-form').value
    let message = document.getElementById('message').value
    // console.log(name)
    // console.log(email)
    // console.log(telp)
    // console.log(subjectForm)
    // console.log(message)

    let a = document.createElement('a')
    a.href = `mailto:${myEmail}?subject=${subjectForm}&body=Hello My Name ${name} ${message}, please call me at ${telp} you want to join in my project`
    a.click()
}