let blogs = []

let postProject = (event) => {
    event.preventDefault()
    const titleProject = document.getElementById('titleProject').value
    let startProject = document.getElementById('startDateProject').value
    let endProject = document.getElementById('endDateProject').value
    const descriptionProject = document.getElementById('descriptionProject').value
    let imagesProject = document.getElementById('inputImageProject').files[0]

    // validation image if image haven't input file
    if (imagesProject) {
        imagesProject = URL.createObjectURL(imagesProject)
    }

    // looping value checkbox
    checkedValue = [];
    let technologyProject = document.getElementsByClassName('checkboxProject');
    let data = technologyProject.length
    for (var i = 0; i < data; i++) {
        if (technologyProject[i].checked == true) {
            checkedValue.push(technologyProject[i].value)
        }
    }

    let blog = {
        titleProject,
        descriptionProject,
        checkedValue,
        imagesProject,
        startProject,
        endProject,
    }
    blogs.push(blog)
    console.log(blog)

    renderProject()

}

const renderProject = () => {
    let renderCardProject = document.getElementById('cardProjectRender')

    renderCardProject.innerHTML = ""
    for (i = 0; i < blogs.length; i++) {
        renderCardProject.innerHTML += `<div class="cardProjectRender">
        <div class="projectImgWrapper">
            <img src="${blogs[i].imagesProject}" alt="">
        </div>
        <div class="projectContentWrapper">
            <a href="detail-project.html" class="titleCardProject">${blogs[i].titleProject}</a>
            <p class="distanceCardProject">Duration : ${getDuration(blogs[i].startProject, blogs[i].endProject)}</p>
            <p class="descCardProject">${blogs[i].descriptionProject}</p>
            <div class="iconCardProject">
                ${(function icon() {
                let string = ""
                for (let j = 0; j < blogs[i].checkedValue.length; j++) {
                    string += `<div class="itemIconProject">
                            <i class="${blogs[i].checkedValue[j]}"></i>
                        </div>`
                }

                return string
            })()}
            </div>
            <div class="cardProjectAction">
                <a href="#" class="cardEditAction">EDIT</a>
                <a href="#" class="cardDeleteAction">DELETE</a>
            </div>
        </div>
    </div>`
    }
}


function getDuration(start, end) {
    let proStart = new Date(start)
    let proEnd = new Date(end)

    let distance = proEnd - proStart

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
                return daysDistance + ' Days Ago'
            } else {
                let hoursDistance = Math.floor(distance / (60 * 60 * 1000))
                if (hoursDistance != 0) {
                    return hoursDistance + ' Hours Ago'
                } else {
                    let minuteDistance = Math.floor(distance / (60 * 1000))
                    if (minuteDistance != 0) {
                        return minuteDistance + ' Minutes Ago'
                    } else {
                        let secondDistance = Math.floor(distance / 1000)
                        if (secondDistance != 0)
                            return secondDistance + ' sec'
                    }
                }
            }
        }
    }
}
