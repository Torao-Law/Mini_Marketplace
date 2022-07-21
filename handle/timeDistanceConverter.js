exports.timeDistanceConverter = (start, end) => {
    let startProject = new Date(start)
    let endProject = new Date(end)

    let distance = endProject - startProject

    let yearDistance = Math.floor(distance / (12 * 30 * 24 * 60 * 60 * 1000))
    if (yearDistance != 0) {
        return yearDistance + ' month'
    } else {

        let monthDistance = Math.floor(distance / (30 * 24 * 60 * 60 * 1000))
        if (monthDistance != 0) {
            return monthDistance + ' month'
        } else {
            let weekDistance = Math.floor(distance / (7 * 24 * 60 * 60 * 1000))
            if (weekDistance != 0) {
                return weekDistance + ' weeks'
            } else {
                let daysDistance = Math.floor(distance / (24 * 60 * 60 * 1000))
                if (daysDistance != 0) {
                    return daysDistance + ' Days'
                }
            }
        }
    }
}