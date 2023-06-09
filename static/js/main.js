(function($) {

	"use strict";

	// Setup the calendar with the current date
$(document).ready(function(){
    var date = new Date();
    var today = date.getDate();
    // Set click handlers for DOM elements
    $(".right-button").click({date: date}, next_year);
    $(".left-button").click({date: date}, prev_year);
    $(".month").click({date: date}, month_click);
    $("#add-button").click({date: date}, new_event);
    // Set current month as active
    $(".months-row").children().eq(date.getMonth()).addClass("active-month");
    init_calendar(date);
    var events = check_events(today, date.getMonth()+1, date.getFullYear());
    show_events(events, months[date.getMonth()], today);
});

// Initialize the calendar by appending the HTML dates
function init_calendar(date) {
    $(".tbody").empty();
    $(".events-container").empty();
    var calendar_days = $(".tbody");
    var month = date.getMonth();
    var year = date.getFullYear();
    var day_count = days_in_month(month, year);
    var row = $("<tr class='table-row'></tr>");
    var today = date.getDate();
    // Set date to 1 to find the first day of the month
    date.setDate(1);
    var first_day = date.getDay();
    // 35+firstDay is the number of date elements to be added to the dates table
    // 35 is from (7 days in a week) * (up to 5 rows of dates in a month)
    for(var i=0; i<35+first_day; i++) {
        // Since some of the elements will be blank, 
        // need to calculate actual date from index
        var day = i-first_day+1;
        // If it is a sunday, make a new row
        if(i%7===0) {
            calendar_days.append(row);
            row = $("<tr class='table-row'></tr>");
        }
        // if current index isn't a day in this month, make it blank
        if(i < first_day || day > day_count) {
            var curr_date = $("<div class='table-date-wrapper'>"+"</div>");
            row.append(curr_date);
        }   
        else {
            var curr_date = $(`<div class='table-date-wrapper ${day} ${month+1} ${year}'><div class='circle'></div><td class='table-date'>${day}</td></div>`);
            var events = check_events(day, month+1, year);
            if(today===day && $(".active-date").length===0) {
                curr_date.addClass("active-date");
            }
            // Set onClick handler for clicking a date
            curr_date.click({events: events, month: months[month], day:day}, date_click);
            row.append(curr_date);

            // DB에 저장된 이모티콘 각 날짜에 넣기
            fetch('/icon').then(res => res.json()).then(data => {
                let icon_month;
                let rows = data['result']
                rows.forEach((a) => {
                    switch(a['month']) {
                        case 'January': 
                            icon_month = 1
                            break
                        case 'February':
                            icon_month = 2
                            break
                        case 'March':
                            icon_month = 3
                            break
                        case 'April':
                            icon_month = 4
                            break
                        case 'May':
                            icon_month = 5
                            break
                        case 'Jun': 
                            icon_month = 6
                            break
                        case 'July':
                            icon_month = 7
                            break
                        case 'August':
                            icon_month = 8
                            break
                        case 'September':
                            icon_month = 9
                            break
                        case 'October':
                            icon_month = 10
                            break
                        case 'November':
                            icon_month = 11
                            break
                        default:
                            icon_month = 12
                    }
                    $(`.table-date-wrapper.${a['day']}.${icon_month}.${a['year']}`).empty()
                    let temp_html = `<img class="inserted-icon" src="${a['src']}" /><div>${a['day']}</div>`
                    $(`.table-date-wrapper.${a['day']}.${icon_month}.${a['year']}`).append(temp_html)
                })
            })
        }
    }
    // Append the last row and set the current year
    calendar_days.append(row);
    $(".year").text(year);
}

// Get the number of days in a given month/year
function days_in_month(month, year) {
    var monthStart = new Date(year, month, 1);
    var monthEnd = new Date(year, month + 1, 1);
    return (monthEnd - monthStart) / (1000 * 60 * 60 * 24);    
}

// Event handler for when a date is clicked
function date_click(event) {
    $(".events-container").show(250);
    $("#dialog").hide(250);
    $(".active-date").removeClass("active-date");
    $(this).addClass("active-date");
    show_events(event.data.events, event.data.month, event.data.day);
};

// Event handler for when a month is clicked
function month_click(event) {
    $(".events-container").show(250);
    $("#dialog").hide(250);
    var date = event.data.date;
    $(".active-month").removeClass("active-month");
    $(this).addClass("active-month");
    var new_month = $(".month").index(this);
    date.setMonth(new_month);
    init_calendar(date);
}

// Event handler for when the year right-button is clicked
function next_year(event) {
    $("#dialog").hide(250);
    var date = event.data.date;
    var new_year = date.getFullYear()+1;
    $("year").html(new_year);
    date.setFullYear(new_year);
    init_calendar(date);
}

// Event handler for when the year left-button is clicked
function prev_year(event) {
    $("#dialog").hide(250);
    var date = event.data.date;
    var new_year = date.getFullYear()-1;
    $("year").html(new_year);
    date.setFullYear(new_year);
    init_calendar(date);
}

// Event handler for clicking the new event button
function new_event(event) {
    // if a date isn't selected then do nothing
    if($(".active-date").length===0)
        return;
    // remove red error input on click
    $("input").click(function(){
        $(this).removeClass("error-input");
    })
    // empty inputs and hide events
    $("#dialog input[type=text]").val('');
    $("#dialog input[type=number]").val('');
    $(".events-container").hide(250);
    $("#dialog").show(250);
    // Event handler for cancel button
    $("#cancel-button").click(function() {
        $("#name").removeClass("error-input");
        $("#count").removeClass("error-input");
        $("#dialog").hide(250);
        $(".events-container").show(250);
    });
    // Event handler for ok button
    $("#ok-button").unbind().click({date: event.data.date}, function() {
        var date = event.data.date;
        var name = $("#name").val().trim();
        var count = parseInt($("#count").val().trim());
        var day = parseInt($(".active-date").html());
        // Basic form validation
        if(name.length === 0) {
            $("#name").addClass("error-input");
        }
        else if(isNaN(count)) {
            $("#count").addClass("error-input");
        }
        else {
            $("#dialog").hide(250);
            console.log("new event");
            new_event_json(name, count, date, day);
            date.setDate(day);
            init_calendar(date);
        }
    });
}

// Adds a json event to event_data
function new_event_json(name, count, date, day) {
    var event = {
        "occasion": name,
        "invited_count": count,
        "year": date.getFullYear(),
        "month": date.getMonth()+1,
        "day": day
    };
    event_data["events"].push(event);
}

// Display all events of the selected date in card views
function show_events(events, month, day) {
    // Clear the dates container
    $(".events-container").empty();
    $(".events-container").show(250);
    console.log(event_data["events"]);
    // If there are no events for this date, notify the user
    if(events.length===0) {
        var event_card = $("<div class='event-card'></div>");
        var event_name = $("<div class='event-name'>There are no events planned for "+month+" "+day+".</div>");
        $(event_card).css({ "border-left": "10px solid #FF1744" });
        $(event_card).append(event_name);
        $(".events-container").append(event_card);
    }
    else {
        // Go through and add each event as a card to the events container
        for(var i=0; i<events.length; i++) {
            var event_card = $("<div class='event-card'></div>");
            var event_name = $("<div class='event-name'>"+events[i]["occasion"]+":</div>");
            var event_count = $("<div class='event-count'>"+events[i]["invited_count"]+" Invited</div>");
            if(events[i]["cancelled"]===true) {
                $(event_card).css({
                    "border-left": "10px solid #FF1744"
                });
                event_count = $("<div class='event-cancelled'>Cancelled</div>");
            }
            $(event_card).append(event_name).append(event_count);
            $(".events-container").append(event_card);
        }
    }

    // 이모티콘 클릭 시 이미지 소스, 년, 월, 일을 데이터 베이스에 저장
    $('.icon').off("click").on('click',(function() {
        $('.icon.active-icon').removeClass("active-icon")
        $(this).addClass("active-icon")
        let formData = new FormData();
        formData.append("day_give", day);
        formData.append("month_give", month);
        formData.append("year_give", $(".year").text())
        formData.append("src_give", $('.icon.active-icon').attr('src'));
        fetch('/icon', {method: "POST",body: formData,}).then((response) => response.json()).then((data) => { })
    }))

     // 확인 버튼 클릭시 새로고침
     $('.icon-btn').click(function() {
        window.location.reload()
    })

    // a태그로 index.html에서 edit.html로 데이터 전달
    let icon_month
    switch(month) {
        case 'January': 
            icon_month = 1
            break
        case 'February':
            icon_month = 2
            break
        case 'March':
            icon_month = 3
            break
        case 'April':
            icon_month = 4
            break
        case 'May':
            icon_month = 5
            break
        case 'Jun': 
            icon_month = 6
            break
        case 'July':
            icon_month = 7
            break
        case 'August':
            icon_month = 8
            break
        case 'September':
            icon_month = 9
            break
        case 'October':
            icon_month = 10
            break
        case 'November':
            icon_month = 11
            break
        default:
            icon_month = 12
    }
    $('.atag').attr('href', `/static/html/edit.html?day=${day}&month=${icon_month}&year=${$(".year").text()}`)

    // 투두리스트 불러오기
    fetch('/todo').then(res => res.json()).then(data => {
        let rows = data['result']
        $(`.to-do-wrapper`).empty()
        rows.forEach((a) => {
            if((day == a['day']) && a['month'] == icon_month && $(".year").text() == a['year']) {
                    let temp_html = `<div class="to-do">
                                        <div class="check-box"></div>
                                        <p class="content">${a['todo']}</p>
                                    </div>`
                $(`.to-do-wrapper`).append(temp_html)
            }
        })
        // 체크박스 활성화 비활성화
        $('.check-box').click(function() {
            if ($(this).hasClass('active') == true) {
                $(this).removeClass('active')
                $(this).empty()
            } else {
                $(this).addClass('active')
                $(this).append(`<img class="check-icon" src="/static/img/check.svg">`)
            }
        })
    })

    // 다이어리 불러오기
    fetch('/diary').then(res => res.json()).then(data => {
        let rows = data['result']
        $(`.diary-content-wrapper`).empty()
        rows.forEach((a) => {
            if((day == a['day']) && a['month'] == icon_month && $(".year").text() == a['year']) {
                    let temp_html = `<p class="diary-content">${a['diary']}</p>`
                $(`.diary-content-wrapper`).append(temp_html)
            }
        })
    })
}

// Checks if a specific date has any events
function check_events(day, month, year) {
    var events = [];
    for(var i=0; i<event_data["events"].length; i++) {
        var event = event_data["events"][i];
        if(event["day"]===day &&
            event["month"]===month &&
            event["year"]===year) {
                events.push(event);
            }
    }
    return events;
}

// Given data for events in JSON format
var event_data = {
    "events": [
    {
        "occasion": " Repeated Test Event ",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 10,
        "cancelled": true
    },
    {
        "occasion": " Repeated Test Event ",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 10,
        "cancelled": true
    },
        {
        "occasion": " Repeated Test Event ",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 10,
        "cancelled": true
    },
    {
        "occasion": " Repeated Test Event ",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 10
    },
        {
        "occasion": " Repeated Test Event ",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 10,
        "cancelled": true
    },
    {
        "occasion": " Repeated Test Event ",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 10
    },
        {
        "occasion": " Repeated Test Event ",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 10,
        "cancelled": true
    },
    {
        "occasion": " Repeated Test Event ",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 10
    },
        {
        "occasion": " Repeated Test Event ",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 10,
        "cancelled": true
    },
    {
        "occasion": " Repeated Test Event ",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 10
    },
    {
        "occasion": " Test Event",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 11
    }
    ]
};

const months = [ 
    "January", 
    "February", 
    "March", 
    "April", 
    "May", 
    "June", 
    "July", 
    "August", 
    "September", 
    "October", 
    "November", 
    "December" 
];

})(jQuery);