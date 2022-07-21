// const month = [
//     "Jan",
//     "Feb",
//     "Mar",
//     "Apr",
//     "Mei",
//     "Jun",
//     "Jul",
//     "Aug",
//     "Sep",
//     "Oct",
//     "Nov",
//     "Des"
// ]
const month = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

exports.timeConverter = (time) => {
    let date = time.getDate()
    let monthIndex = time.getMonth()
    let year = time.getFullYear()

    const dateFormat = (date) => {
        if (date < 10) {
            return `0${date}`
        }

        return date
    }

    let fulltime = `${dateFormat(date)}-${month[monthIndex]}-${year}`
    return fulltime
}
