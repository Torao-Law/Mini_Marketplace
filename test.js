const checkTech = (value) => {
    const array = ['fa-brands fa-angular', 'fa-brands fa-node-js', 'fa-brands fa-react', 'fa-brands fa-vuejs'];

    let object = {}

    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < value.length; j++) {
            if (value[j] == array[i]) {
                object[array[i]] = array[i]
            }
        }
    }

    console.log(object);
}

checkTech(['fa-brands fa-node-js', 'fa-brands fa-vuejs'])