$ = jQuery.noConflict();
$(document).ready(function ($) {
    $('#sidebarCollapse').on('click', function () {
        $('.btn-expanded').toggleClass('btn-collapsed');
    });
});
jQuery(window).on('resize', function () {
    var win = jQuery(this); //this = window
    if (win.height() <= 820) {
        $height_fix = (win.height() - 190);
        jQuery('#sidebar').height($height_fix + 'px');
    }

});

if (window.matchMedia('(max-width: 768px)').matches)
{
    $(document).ready(function () {
        $('#sidebarCollapse').on('click', function () {
            $('#wrapper').toggleClass('active');
        });
    });
}

//Local Storage
var storage;
var fail;
var uid;
try {
    uid = new Date;
    (storage = window.localStorage).setItem(uid, uid);
    fail = storage.getItem(uid) != uid;
    storage.removeItem(uid);
    fail && (storage = false);
} catch (exception) {
}
$(function ($) {
    if (storage) {
        $('#wrapper').toggleClass('active', storage.getItem('active') == '1');
        $('#sidebarCollapse').on('click', function (e) {
            e.preventDefault();
            var setOpen = storage.getItem('active') == '1' ? 0 : 1; // set opento the oposite of current
            storage.setItem('active', setOpen);
            $('#wrapper').toggleClass('active', setOpen);
        });
    }
});
$(function ($) {
    if (storage) {
        $('.left').toggleClass('expanded', storage.getItem('expanded') == '1');
        $('#sidebarCollapse').on('click', function (e) {
            e.preventDefault();
            var setOpen = storage.getItem('expanded') == '1' ? 0 : 1; // set opento the oposite of current
            storage.setItem('expanded', setOpen);
            $('.left').toggleClass('expanded', setOpen);
        });
    }
});
/* Starts Search Validations */
jQuery(document).ready(function ($) {
    $('.md-input .md-form-control').keyup(function () {
        var $this = $(this);
        if ($(this).val().length != 0) {
            $this.siblings('label').addClass('active');
        } else
        {
            $this.siblings('label').removeClass('active');
        }
    })
});
