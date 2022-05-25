// анимируем заголовок
let textWrapper = document.querySelector('.letters');
//оборачиваем каждую букву в контейнер, чтобы потом работать с ними по отдельности
textWrapper.innerHTML = textWrapper.textContent.replace(/\S/g, "<span class='letter'>$&</span>");

anime.timeline({loop: true})
  .add({
    targets: '.letter',
    scale: [0.3,1],
    opacity: [0,1],
    translateZ: 0,
    easing: "linear",
    duration: 600,
    delay: (el, i) => 70 * (i+1)
  }).add({
    targets: '.title',
    opacity: 0,
    duration: 5000,
    easing: "linear",
    delay: 10000
  });

let taskDateElem = document.getElementById('datepicker');
hideBlock( taskDateElem );

let taskTypeElem = document.getElementById('task-type');

let resultBlock = document.getElementById('result-block');
hideBlock( resultBlock );

let resultItemsBlock = document.getElementById('result-items-id');

let errorBlock = document.getElementById('error-block');
hideBlock( errorBlock );
let errors = [];

// заполним список типов задач, desc ен использован пока
const taskTypesList = [
    {
        "id" : "housework",
        "title" : "Работа по дому",
        "desc" : "То, что приходится делать дома каждый день" 
    },
    {
        "id" : "studying",
        "title" : "Учеба",
        "desc" : "Все, что связано с изучением нового материала по фронтенду и сопутствующие мероприятия" 
    },
    {
        "id" : "for-myself",
        "title" : "Для себя",
        "desc" : "Каждый день нужно делать не только то, что нужно, но и то, что нравится. Для себя, своего здоровья и внешности" 
    }

];

// параметры статусов, можно добавить новые, пока есть:
//  - цвет
//  - индекс для подсчета количества задач за день
const statusList = {
    "created" : {
        "color" : 'rgb(255, 99, 132)',
        "ind": 0,
        "extra-classes" : ['status-created']
    },
    "in-progress" : {
        "color" : 'rgb(54, 162, 235)',
        "ind" : 1
    },
    "done" : {
        "color" : 'green',
        "ind" : 2
    }
};

// console.log("statusList " + statusList["created"]["color"]);

// сначала пустая 
createItemOfSelect(
    {
        name: "task-type-option",
        value: "",
        textContent: "Выберите тип задачи",
        elemType: "option"
    },
    taskTypeElem
);

for ( let taskItem of taskTypesList ) {
    // console.log("taskItem " + taskItem["id"], taskItem["title"] );
    createItemOfSelect(
        {
            name: "task-type-option",
            value: taskItem["id"],
            textContent: taskItem["title"],
            elemType: "option"
        },
        taskTypeElem
    );
}

// сюда будем собирать задачи, которые нужно показать, когда будет выбрана дата и тип задач 
// для формирования этого списка каждый раз будем зачитывать весь файл
let taskList = [];

// выбранная дата
let checkedDate = "";

// файл с информацией обо всех задачах
const dataJsonFile = "./assets/data/data.json";

// список задач пока скроем
hideBlock( taskTypeElem );

let picker = new Pikaday({
    onSelect: function(date) {
        taskDateElem.textContent = this.getMoment().format('DD MMMM YYYY');
        checkedDate = this.getMoment().format('YYYY-MM-DD');
        hideBlock( picker.el );
        showBlock(taskDateElem);
        showBlock( taskTypeElem );
        // скрыть блок с результатом (перечень задач + диаграмма)
        hideBlock( resultBlock );
        //очистить список задач
        taskList = [];
        // очистить диаграмму, если она сейчас используется
        if ( myChart ) myChart.destroy();
    } 
});
// установка минимальной даты, которую можно выбрать
picker.setMinDate(new Date("2022-05-18"));

taskDateElem.parentNode.insertBefore(picker.el, taskDateElem.nextSibling);

taskDateElem.addEventListener("click", (event) => {
    showBlock( picker.el );
    hideBlock( taskTypeElem );

    removeErrors();
    hideBlock( errorBlock );
});

// это наш будущий чарт типа донат, который будет показывать, сколько задач в каком статусе за день
let myChart;

taskTypeElem.addEventListener("change", (event) => {
    // при изменении показываем блок result-block со списком задач и диаграммой или скрываем блок result-block и очищаем данные
    let checkedTaskType = event.target.value;

    removeErrors();
    hideBlock( errorBlock );
    
    taskList = [];
    if ( myChart ) myChart.destroy();
    

    if ( !checkedTaskType ) {
        // если не выбран тип задач
        // очистить список задач, уже очищен
        // скрыть блок со списком задач и чартом
        hideBlock( resultBlock );
    } else {
        // если выбран тип задач
        // зачитать список задач выбранного типа за выбранный день
        getData( checkedDate, checkedTaskType );

    }
});

function showErrors() {
    console.log("showErrors started");
}

function hideBlock( elem ) {
    elem.style.display = "none";
}

function showBlock( elem ) {
    elem.style.display = "";
}

function createItemOfSelect ( item, parentElem ) {
    // для создания пункта в выпадающем списке
    // item.name - что в атрибуте name
    // item.value - что в атирибуте value
    // item.textContent - что в подписи
    // item.elemType - какой тип элемента - option
    // item.parentElem - в какой элемент добавляем
    let newOption = document.createElement(item.elemType);
    newOption.setAttribute("name", item.name);
    newOption.setAttribute("value", item.value);
    newOption.textContent = item.textContent;
    newOption.setAttribute("type", item.type);
    parentElem.appendChild(newOption);
}

function removeErrors() {
    errors = [];
}

// очистка блока
function clearBlock( block ) {
    let blockLength = block.children.length;
    for ( let ii = 0; ii < blockLength; ii++ ) {
        block.removeChild(block.lastElementChild);
    }
}

// добавление элемента .result__item в .result__items 
function addTaskCard( item, parentElem ) {
    console.log("addTaskCard started");
    console.log("item " + item);
    console.log("parentElem " + parentElem);

    let cardDiv = document.createElement("div");
    cardDiv.setAttribute("class", "result__item");
    parentElem.appendChild(cardDiv);

    let h2 = document.createElement("h2");
    h2.textContent = item["task-title"];
    h2.setAttribute("class", "subtitle");
    cardDiv.appendChild(h2);

    if ( item["task-desc"] ) {
        let desc = document.createElement("div");
        desc.textContent = item["task-desc"];
        cardDiv.appendChild(desc);
    }
    if ( item["status"] ) {
        let status = document.createElement("div");
        status.textContent = item["status"];
        // status.setAttribute("class", "status");
        status.classList.add("status");
        status.style.color = statusList[item["status"]]["color"];

        if (statusList[item["status"]]["extra-classes"]) 
            statusList[item["status"]]["extra-classes"].forEach(element => {
                status.classList.add(element);
            });
        cardDiv.appendChild(status);
    }        

    console.log("addTaskCard finished");
}

// получить данные о задачах типа taskTypeSelected в день day из файла с информацией обо всех задачах
function getData( day, taskTypeSelected ) {
    console.log("getData started");
    console.log("day " + day);
    console.log("taskTypeSelected " + taskTypeSelected);
    let resultList = [];
    clearBlock(resultItemsBlock);
  
    fetch(dataJsonFile)
    .then( response => {
            if ( !response.ok ) {
                throw Error( "Статус " + response.status + " при попытке зачитать " + dataJsonFile );
            }
            return response.json()
            // console.log("response " + response.json());
        }
    )
    .then(result => {
      for ( let i = 0; i < result.length; i++ ) {
        // console.log(i + " " + result[i]["date"]);
        // console.log(i + " " + result[i]["task-type"]);
        if ( 
                (result[i]["date"] == day ) 
                && ( result[i]["task-type"] == taskTypeSelected ) 
        ) {
            resultList.push(result[i]);
        }
      }
      // обрабатываем resultList, который нужно показать
      showBlock( resultBlock );
      if ( resultList.length ) {
            console.log("сейчас покажем задачи за день и тип");

            let taskStatusNum = [ 0, 0, 0 ];
            for ( res of resultList ) {
                addTaskCard( res, resultItemsBlock );
                taskStatusNum[ statusList[res['status']]['ind'] ]++;
            }
            // анимация статуса created
            anime.timeline({loop: true})
               .add({
                    targets: '.status-created',
                    opacity: 0,
                    duration: 500,
                    easing: "linear",
                    delay: 100
                });
            let ctx = document.getElementById('myChart');
            let data = {
                labels: [
                  'Created',
                  'In progress',
                  'Done'
                ],
                datasets: [{
                  label: 'Мои задачи за день',
                  data: taskStatusNum,
                  backgroundColor: [
                    'rgb(255, 99, 132)',
                    'rgb(54, 162, 235)',
                    'green'
                  ],
                //   hoverOffset: 4
                }]
              };
            myChart = new Chart(ctx, {
                type: 'doughnut',
                data: data,
            });

      } else {
          // нечего показывать
          addTaskCard( { "task-title": "Задачи не найдены"}, resultItemsBlock );
      }
    })
    .catch(error => {
            console.log("error " + typeof error + " -- " + error);
            showBlock( errorBlock );
            errorBlock.textContent = "Ошибка при загрузке данных " + error;
    } )
    ;
}