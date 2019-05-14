$(".datePicker").datepicker({
    format: 'dd-M-yyyy',
    todayHighlight: true,
    autoclose: true,
});
//datePicker lavel top
$(".md-form-control.datePicker").click(function () {
    var $this = $(this);
    if ($(this).val() == "") {
        $this.siblings('label').addClass('active');
    }
});

function parse_query_string(query) {
    var vars = query.split("&");
    var query_string = {};
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        var key = decodeURIComponent(pair[0]);
        var value = decodeURIComponent(pair[1]);
        // If first entry with this name
        if (typeof query_string[key] === "undefined") {
            query_string[key] = decodeURIComponent(value);
            // If second entry with this name
        } else if (typeof query_string[key] === "string") {
            var arr = [query_string[key], decodeURIComponent(value)];
            query_string[key] = arr;
            // If third or later entry with this name
        } else {
            query_string[key].push(decodeURIComponent(value));
        }
    }
    return query_string;
}

function GetFormattedDate(date) {
    var d = new Date(date);
    var final = d.getDate().toString() + '-' + (d.getMonth() + 1).toString() + '-' + d.getFullYear().toString();
    return final;
}

function formatMysqlDate(unix_timestamp) {
    var formattedTime = new Date(unix_timestamp * 1000).toJSON().slice(0, 19).replace('T', ' ');
    return formattedTime;
}