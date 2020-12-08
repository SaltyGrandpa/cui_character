var hairColors = {}
var lipstickColors = {}
var facepaintColors = {}
var blusherColors = {}

$(document).ready(function() {
    window.addEventListener('message', function(event) {
        if (event.data.action == 'setVisible') {
            if (event.data.show) {
                $('body').fadeIn(100)
            }
            else {
                $('body').fadeOut(100)
            }
        }
        else if (event.data.action == 'clearAllTabs') {
            $('.tablinks').hide()
            $('.tablinks').removeClass('active');
            $('.tabcontent').hide()
            $('.tabcontent').empty()
        }
        else if (event.data.action == 'enableTabs') {
            for (const value of Object.values(event.data.tabs)) {
                $('button' + '#tab-' + value + '.tablinks').show()
                if (event.data.clothes) {
                    loadTabContent(value, event.data.character, event.data.clothes)
                }
                else {
                    loadTabContent(value, event.data.character, null)
                }
            }
        }
        else if (event.data.action == 'activateTab') {
            $('#tab-' + event.data.tab).addClass('active');
            $('#' + event.data.tab).show()
            $.post('https://cui_character/setCurrentTab', JSON.stringify({
                tab: event.data.tab,
            }));
        }
        else if (event.data.action == 'reloadTab') {
            $('div#' + event.data.tab + '.tabcontent').empty();
            if (event.data.clothes) {
                loadTabContent(event.data.tab, event.data.character, event.data.clothes)
            }
            else {
                loadTabContent(event.data.tab, event.data.character, null)
            }
        }
        else if (event.data.action == 'refreshViewButtons') {
            $('.cameraview').removeClass('active')
            $('#view' + event.data.view).addClass('active')
        }
        else if (event.data.action == 'refreshMakeup') {
            refreshMakeupUI(event.data.character, true);
            if (event.data.character.sex == 1) {
                let blusher = $(document).find('#blusher');
                if (event.data.character.makeup_type == 2) {
                    if (blusher.hasClass('group')) {
                        blusher.removeClass('group');
                    }
                    blusher.empty();
                }
                else {
                    blusher.addClass('group')
                    $.get('pages/optional/blusher.html', function(data) {
                        blusher.html(data);
                        loadColorPalettes(blusher);
                        refreshContentData(blusher, event.data.character);
                    });
                }
            }
        }
        else if (event.data.action == 'loadColorData') {
            hairColors = event.data.hair
            lipstickColors = event.data.lipstick
            facepaintColors = event.data.facepaint
            blusherColors = event.data.blusher
        }
    });
});

/*  camera control  */
function setView(event, view) {
    let wasActive = $(event.target).hasClass('active');
    $('.cameraview').removeClass('active')

    if (!wasActive) {
        $.post('https://cui_character/setCameraView', JSON.stringify({
            view: view,
        }));
    }

    $(event.target).addClass('active')
}

var moving = false
var lastOffsetX = 0
var lastOffsetY = 0
var lastScreenX = 0.5 * screen.width
var lastScreenY = 0.5 * screen.height

$('#cameracontrol').on('mousedown', function(event) {
    if (event.button == 0) {
        moving = true;
    }
});

$('#cameracontrol').on('mouseup', function(event) {
    if (moving && event.button == 0) {
        moving = false;
    }
});

$('#cameracontrol').on('mousemove', function(event) {
    if (moving == true) {
        let offsetX = event.screenX - lastScreenX;
        let offsetY = event.screenY - lastScreenY;
        if ((lastOffsetX > 0 && offsetX < 0) || (lastOffsetX < 0 && offsetX > 0)) {
            offsetX = 0
        }
        if ((lastOffsetY > 0 && offsetY < 0) || (lastOffsetY < 0 && offsetY > 0)) {
            offsetY = 0
        }
        lastScreenX = event.screenX;
        lastScreenY = event.screenY;
        lastOffsetX = offsetX;
        lastOffsetY = offsetY;
        $.post('https://cui_character/updateCameraRotation', JSON.stringify({
            x: offsetX,
            y: offsetY,
        }));
    }
});

$('#cameracontrol').on('wheel', function(event) {
    let zoom = event.originalEvent.deltaY / 2000;
    $.post('https://cui_character/updateCameraZoom', JSON.stringify({
        zoom: zoom,
    }));
});

/*  content loading     */
function loadTabContent(tabName, charData, clothesData) {
    $.get('pages/' + tabName + '.html', function(data) {
        let tab =  $('div#' + tabName + '.tabcontent');
        tab.html(data);
        if (tabName == 'style') {
            loadOptionalContent(tab, charData);
            refreshMakeupUI(charData, false)
            loadColorPalettes(tab)
        }
        else if ((tabName == 'apparel') && clothesData) {
            let male = (charData.sex == 0)
            loadClothesTab(tab, clothesData, male)
        }
        refreshContentData(tab, charData);
        if (tabName == 'identity') {
            updatePortrait('mom');
            updatePortrait('dad');
        }
    });
}

function loadOptionalContent(element, charData) {
    let hair = element.find('#hair');
    let facialhair = element.find('#facialhair');
    let chesthair = element.find('#chesthair');
    let blusher = element.find('#blusher');

    hair.empty()
    facialhair.empty()
    blusher.empty();

    if (chesthair.hasClass('group')) {
        chesthair.removeClass('group')
    }

    if (chesthair.hasClass('group')) {
        chesthair.removeClass('group')
    }

    if (blusher.hasClass('group')) {
        blusher.removeClass('group')
    }

    let hairpage = 'pages/optional/hair_';
    // male
    if (charData.sex == 0) {
        let suffix = 'male.html'
        hairpage = hairpage + suffix;
        facialhair.addClass('group')
        $.get('pages/optional/facialhair.html', function(data) {
            facialhair.html(data);
            loadColorPalettes(facialhair);
            refreshContentData(facialhair, charData);
        });
        chesthair.addClass('group')
        $.get('pages/optional/chesthair.html', function(data) {
            chesthair.html(data);
            loadColorPalettes(chesthair);
            refreshContentData(chesthair, charData);
        });
    }
    // female
    else if (charData.sex == 1) {
        let suffix = 'female.html'
        hairpage = hairpage + suffix;
        if (charData.makeup_type != 2) {
            blusher.addClass('group')
            $.get('pages/optional/blusher.html', function(data) {
                blusher.html(data);
                loadColorPalettes(blusher);
                refreshContentData(blusher, charData);
            });
        }
    }

    $.get(hairpage, function(data) {
        hair.html(data);
        loadColorPalettes(hair);
        refreshContentData(hair, charData);
    });
}

function loadColorPalettes(element) {
    $(element).find('.palette').each(function() {
        let colorData = null
        if ($(this).hasClass('hair')) {
            colorData = hairColors;
        }
        else if ($(this).hasClass('lipstick')) {
            colorData = lipstickColors;
        }
        else if ($(this).hasClass('facepaint')) {
            colorData = facepaintColors;
        }
        else if ($(this).hasClass('blusher')) {
            colorData = blusherColors;
        }

        $(this).empty()
        let id = $(this).attr('id')
        for (const color of colorData) {
            let inputTag = '<input type="radio" name="' + id + '" ' + 'value="' + color.index + '"/>';
            let newElement = $('<div class="radiocolor">' + inputTag + '<label></label></div>');
            newElement.find('input[type="radio"] + label').css('background-color', color.hex);
            $(this).append(newElement);
        }
    });
}

function loadClothesTab(tab, clothesData, male) {
    // tops
    let topsoverlist = tab.find('select#topover.clotheslist');
    let noover = male ? 0 : 16;
    topsoverlist.empty();
    topsoverlist.append($('<option data-component="11" data-drawable="15" data-texture="' + noover + '">None</option>')) // "None" option
    clothesData.topsover.forEach(function (item) {
        let option = $('<option data-component="' + item.component + '" data-drawable="' + item.drawable + '" data-texture="' + item.texture + '"></option>');
        option.text(item.name)
        topsoverlist.append(option);
    });

    let topsunderlist = tab.find('select#topunder.clotheslist');
    let nounder = male ? 15 : -1;
    topsunderlist.empty();
    topsunderlist.append($('<option data-component="8" data-drawable="' + nounder + '" data-texture="0">None</option>')) // "None" option
    clothesData.topsunder.forEach(function (item) {
        let option = $('<option data-component="' + item.component + '" data-drawable="' + item.drawable + '" data-texture="' + item.texture + '"></option>');
        option.text(item.name)
        topsunderlist.append(option);
    });

    // pants
    let pantslist = tab.find('select#pants.clotheslist');
    pantslist.empty();
    clothesData.pants.forEach(function (item) {
        let option = $('<option data-component="' + item.component + '" data-drawable="' + item.drawable + '" data-texture="' + item.texture + '"></option>');
        option.text(item.name)
        pantslist.append(option);
    });

    // shoes
    let shoeslist = tab.find('select#shoes.clotheslist');
    let noshoes = male ? 34 : 35;
    shoeslist.empty();
    shoeslist.append($('<option data-component="6" data-drawable="' + noshoes + '" data-texture="0">None</option>')) // "None" option
    clothesData.shoes.forEach(function (item) {
        let option = $('<option data-component="' + item.component + '" data-drawable="' + item.drawable + '" data-texture="' + item.texture + '"></option>');
        option.text(item.name)
        shoeslist.append(option);
    });

    /* bags     NOTE: there seems to be no named components in this category, commenting it out
    let bagslist = tab.find('select#bag.clotheslist');
    bagslist.empty();
    bagslist.append($('<option data-component="5" data-drawable="0" data-texture="0">None</option>')) // "None" option
    clothesData.bags.forEach(function (item) {
        let option = $('<option data-component="' + item.component + '" data-drawable="' + item.drawable + '" data-texture="' + item.texture + '"></option>');
        option.text(item.name)
        bagslist.append(option);
    });
    */

    // neck or arm accessory
    let neckarmslist = tab.find('select#neckarm.clotheslist');
    neckarmslist.empty();
    neckarmslist.append($('<option data-component="7" data-drawable="0" data-texture="0">None</option>')) // "None" option
    clothesData.neckarms.forEach(function (item) {
        let option = $('<option data-component="' + item.component + '" data-drawable="' + item.drawable + '" data-texture="' + item.texture + '"></option>');
        option.text(item.name)
        neckarmslist.append(option);
    });

    // hat
    let hatslist = tab.find('select#hat.clotheslist');
    hatslist.empty();
    hatslist.append($('<option data-prop="0" data-drawable="-1" data-texture="0">None</option>')) // "None" option
    clothesData.hats.forEach(function (item) {
        let option = $('<option data-prop="' + item.prop + '" data-drawable="' + item.drawable + '" data-texture="' + item.texture + '"></option>');
        option.text(item.name)
        hatslist.append(option);
    });

    // ear accessory
    let earslist = tab.find('select#ears.clotheslist');
    earslist.empty();
    earslist.append($('<option data-prop="2" data-drawable="-1" data-texture="0">None</option>')) // "None" option
    clothesData.ears.forEach(function (item) {
        let option = $('<option data-prop="' + item.prop + '" data-drawable="' + item.drawable + '" data-texture="' + item.texture + '"></option>');
        option.text(item.name)
        earslist.append(option);
    });

    // glasses
    let glasseslist = tab.find('select#glasses.clotheslist');
    glasseslist.empty();
    glasseslist.append($('<option data-prop="1" data-drawable="-1" data-texture="0">None</option>')) // "None" option
    clothesData.glasses.forEach(function (item) {
        let option = $('<option data-prop="' + item.prop + '" data-drawable="' + item.drawable + '" data-texture="' + item.texture + '"></option>');
        option.text(item.name)
        glasseslist.append(option);
    });

    // left hand accessory
    let lefthandlist = tab.find('select#lefthand.clotheslist');
    lefthandlist.empty();
    lefthandlist.append($('<option data-prop="6" data-drawable="-1" data-texture="0">None</option>')) // "None" option
    clothesData.lefthands.forEach(function (item) {
        let option = $('<option data-prop="' + item.prop + '" data-drawable="' + item.drawable + '" data-texture="' + item.texture + '"></option>');
        option.text(item.name)
        lefthandlist.append(option);
    });

    // right hand accessory
    let righthandlist = tab.find('select#righthand.clotheslist');
    righthandlist.empty();
    righthandlist.append($('<option data-prop="7" data-drawable="-1" data-texture="0">None</option>')) // "None" option
    clothesData.righthands.forEach(function (item) {
        let option = $('<option data-prop="' + item.prop + '" data-drawable="' + item.drawable + '" data-texture="' + item.texture + '"></option>');
        option.text(item.name)
        righthandlist.append(option);
    });
}

var accept = false;

var popupCallback = null;
var popupVal = false

/*  window controls   */
function openPopup(data, callback, val) {
    $('.popup .title').text(data.title)
    $('.popup .message').text(data.message)
    $('.popup').fadeIn(100);
    $('.overlay').fadeIn(100);
    $('#main').css('pointer-events', 'none');
    $('#cameracontrol').css('pointer-events', 'none');
    popupCallback = callback
    popupVal = val
}

function closePopup() {
    $('.popup').fadeOut(100);
    $('.overlay').fadeOut(100);
    $('#main').css('pointer-events', 'auto');
    $('#cameracontrol').css('pointer-events', 'auto');

    if (popupCallback) {
        popupCallback = null;
    }
    popupVal = false
}

function closeWindow(save) {
    $.post('https://cui_character/close', JSON.stringify({save:save}));
}

function openTab(evt, tab) {
    let wasActive = $(evt.target).hasClass('active');

    $('.tabcontent').hide();
    $('.tablinks').removeClass('active');
    $('#' + tab).show();

    if (!wasActive) {
        $.post('https://cui_character/playSound', JSON.stringify({
            sound:'tabchange'
        }));
        $.post('https://cui_character/setCurrentTab', JSON.stringify({
            tab: tab,
        }));
    }

    $(evt.target).addClass('active')
}

$('.panelbottom button').on('click', function(evt) {
    evt.preventDefault();
    $.post('https://cui_character/playSound', JSON.stringify({sound:'panelbuttonclick'}));
});

$('#main .menuclose').on('click', function(evt) {
    evt.preventDefault();
    if (evt.target.id == 'accept') {
        accept = true;
    }
    else if (evt.target.id == 'cancel') {
        accept = false;
    }

    let action = accept ? 'save' : 'discard';
    let message = 'Are you sure you want to ' + action + ' your changes and exit?';
    let popupData = { 
        title: 'confirmation', 
        message: message
    };
    openPopup(popupData, closeWindow, accept);
});

$('.popup #no').on('click', function(evt) {
    evt.preventDefault();
    closePopup();
});

$('.popup #yes').on('click', function(evt) {
    evt.preventDefault();

    if (popupCallback) {
        popupCallback(popupVal)
    }

    closePopup();
});

/*  option/value ui controls   */
$(document).on('click', '.controls button', function(evt) {
    $.post('https://cui_character/playSound', JSON.stringify({
        sound: 'listbuttonclick'
    }));
});

$(document).on('click', '.list .controls button', function(evt) {
    let list = $(this).siblings('select').first();
    let numOpt = list.children('option').length
    let oldVal = list.find('option:selected');
    let newVal = null;

    if ($(this).hasClass('left')) {
        if (list.prop('selectedIndex') == 0) {
            newVal = list.prop('selectedIndex', numOpt - 1);
        }
        else {
            newVal = oldVal.prev();
        }
    }
    else if ($(this).hasClass('right')) {
        if (list.prop('selectedIndex') == numOpt - 1) {
            newVal = list.prop('selectedIndex', 0);
        }
        else {
            newVal = oldVal.next();
        }
    }
    oldVal.prop('selected', false)
    newVal.prop('selected', true)
    newVal.trigger('change')
});

$(document).on('click', '.slider .controls button', function(evt) {
    let slider = $(this).siblings('input[type=range]').first();
    let min = parseInt(slider.prop('min'));
    let max = parseInt(slider.prop('max'));
    let val = parseInt(slider.val());

    if ($(this).hasClass('left')) {
        if (val > min) {
            slider.val(val - 1);
        }
    }
    else if ($(this).hasClass('right')) {
        if (val < max) {
            slider.val(val + 1);
        }
    }

    slider.trigger('input');
});

/*  option/value change effects     */
function updateGender(value) {
    $.post('https://cui_character/updateGender', JSON.stringify({
        value: value,
    }));
}

function updateHeadBlend(key, value) {
    $.post('https://cui_character/updateHeadBlend', JSON.stringify({
        key: key,
        value: value,
    }));
}

function updateFaceFeature(key, value, index) {
    $.post('https://cui_character/updateFaceFeature', JSON.stringify({
        key: key,
        value: value,
        index: index,
    }));
}

function updateEyeColor(value) {
    $.post('https://cui_character/updateEyeColor', JSON.stringify({
        value: value,
    }));
}

function updateHairColor(key, value, highlight) {
    $.post('https://cui_character/updateHairColor', JSON.stringify({
        key: key,
        value: value,
        highlight: highlight,
    }));
}

function updateHeadOverlay(key, keyPaired, value, index, isOpacity) {
    $.post('https://cui_character/updateHeadOverlay', JSON.stringify({
        key: key,
        keyPaired: keyPaired, // NOTE: opacity for type and type for opacity
        value: value,
        index: index,
        isOpacity: isOpacity,
    }));
}

function updateHeadOverlayExtra(key, keyPaired, value, index, keyExtra, valueExtra, indexExtra, isOpacity) {
    $.post('https://cui_character/updateHeadOverlayExtra', JSON.stringify({
        key: key,
        keyPaired: keyPaired,
        value: value,
        index: index,
        keyExtra: keyExtra,
        valueExtra: valueExtra,
        indexExtra: indexExtra,
        isOpacity: isOpacity,
    }));
}

function updateOverlayColor(key, value, index, colortype) {
    $.post('https://cui_character/updateOverlayColor', JSON.stringify({
        key: key,
        value: value,
        index: index,
        colortype: colortype,
    }));
}

function updateComponent(drawable, dvalue, texture, tvalue, index) {
    $.post('https://cui_character/updateComponent', JSON.stringify({
        drawable: drawable,
        dvalue: dvalue,
        texture: texture,
        tvalue: tvalue,
        index: index,
    }));
}

// NOTE: This one calls different function than the above,
//       as it needs to check for 'forced components' (torso parts etc.)
function updateApparelComponent(drwkey, drwval, texkey, texval, cmpid) {
    $.post('https://cui_character/updateApparelComponent', JSON.stringify({
        drwkey: drwkey,
        drwval: drwval,
        texkey: texkey,
        texval: texval,
        cmpid: cmpid,
    }));
}

function updateApparelProp(drwkey, drwval, texkey, texval, propid) {
    $.post('https://cui_character/updateApparelProp', JSON.stringify({
        drwkey: drwkey,
        drwval: drwval,
        texkey: texkey,
        texval: texval,
        propid: propid,
    }));
}

function updatePortrait(elemId) {
    let portraitImgId = '#parents' + elemId;
    let portraitName = $('select#' + elemId + '.headblend').find(':selected').data('portrait');
    $(portraitImgId).attr('src', 'https://nui-img/char_creator_portraits/' + portraitName);
}

// working around unintuitive/bad behavior:
// https://forum.jquery.com/topic/alert-message-when-clicked-selected-radio-button
var radioChecked = false
$(document).on('mouseenter', 'input:radio[name=sex] + label', function(evt) {
    if ($(this).prev().is(':checked')) {
        radioChecked = true;
    }
    else {
        radioChecked = false;
    }
});

$(document).on('click', 'input:radio[name=sex]', function(evt) {
    if(radioChecked == false)
    {
        let popupData = {
            title: 'confirmation', 
            message: 'Changing your character\'s gender will reset all current customizations. Are you sure you want to do this?'
        };
        openPopup(popupData, function(target) {
            target.prop('checked', true);
            updateGender(target.val());
        }, $(this));
    }
    return false;
});

$(document).on('click', '.palette input:radio + label', function(evt) {
    let radio = $(this).prev();
    if (radio.is(':not(:checked)')) {
        radio.prop('checked', true);
        radio.trigger('change');
    }
});

$(document).on('change', 'select.headblend', function(evt) {
    updatePortrait($(this).attr('id'));
    updateHeadBlend($(this).attr('id'), $(this).val());
});

$(document).on('change', 'select.eyecolor', function(evt) {
    updateEyeColor($(this).val());
});

$(document).on('change', 'select.component.hairstyle', function(evt) {
    // NOTE: hairstyle is a special case as you don't get to select texture for it
    updateComponent($(this).attr('id'), $(this).val(), 'hair_2', 0, $(this).data('index'));
});

$(document).on('refresh', 'input[type=range].headblend', function(evt) {
    let valueLeft = $(this).parent().siblings('.valuelabel.left');
    let valueRight = $(this).parent().siblings('.valuelabel.right');
    valueLeft.text((100 - $(this).val()).toString() + '%');
    valueRight.text($(this).val().toString() + '%');
});

$(document).on('input', 'input[type=range].headblend', function(evt) {
    $(this).trigger('refresh')
    updateHeadBlend($(this).attr('id'), $(this).val());
});

$(document).on('input', 'input[type=range].facefeature', function(evt) {
    updateFaceFeature($(this).attr('id'), $(this).val(), $(this).data('index'));
});

$(document).on('change', 'select.headoverlay', function(evt) {
    // find the opacity range slider id for this feature
    let pairedId = $(this).parents().eq(2).find('.headoverlay').eq(1).attr('id');
    updateHeadOverlay($(this).attr('id'), pairedId, $(this).val(), $(this).data('index'), false);
});

$(document).on('refresh', 'input[type=range].headoverlay, input[type=range].headoverlayextra, input[type=range].facepaintoverlay', function(evt) {
    let valueCenter = $(this).parent().siblings('.valuelabel.center');
    valueCenter.text($(this).val().toString() + '%');
});

$(document).on('input', 'input[type=range].headoverlay', function(evt) {
    $(this).trigger('refresh')

    // find the style select list id for which this is the opacity value
    let pairedId = $(this).parents().eq(2).find('.headoverlay').eq(0).attr('id');
    updateHeadOverlay($(this).attr('id'), pairedId, $(this).val(), $(this).data('index'), true);
});

/*
    This is a special (extended) case of headoverlay that is used by 'skin blemishes'
    and 'moles & freckles' properties. In addition to changing the face, these also
    change the body.
*/
$(document).on('change', 'select.headoverlayextra', function(evt) {
    let pairedId = $(this).parents().eq(2).find('.headoverlayextra').eq(1).attr('id');
    updateHeadOverlayExtra(
        $(this).attr('id'),
        pairedId,
        $(this).val(),
        $(this).data('index'),
        $(this).data('keyextra'),
        $(this).find('option:selected').data('extra'),
        $(this).data('indexextra'),
        false
    );
});

$(document).on('input', 'input[type=range].headoverlayextra', function(evt) {
    $(this).trigger('refresh')
    let pairedkey = $(this).parents().eq(2).find('.headoverlayextra').eq(0)
    let pairedid = pairedkey.attr('id');
    updateHeadOverlayExtra(
        $(this).attr('id'),
        pairedid,
        $(this).val(),
        $(this).data('index'),
        $(this).data('keyextra'),
        pairedkey.find('option:selected').data('extra'), // NOTE: For opacity this field is used to pass paired (non-opacity) value since we need it in the native call.
        $(this).data('indexextra'),
        true
    );
});

/*
    Face paints are a special (and really complex) case of headoverlay. 
    Some count as makeup and have fixed colors, while others count as blusher and are colorable.

    We need to make sure the color palette appears only when appropriate,
    and that opacity slider doesn't suddenly jump when switching between these types.
*/

function setupFacepaintColors(facepaintgroup, colorable, resetcolor) {
        // Here we create or destroy color palette depending on the chosen facepaint type
        if (colorable) {
            let newelement = `
            <div class="colorselect">
                <h3 class="header">Color</h3>
                <div class="palette facepaint overlaycolor" id="blush_3" data-index="5" data-colortype="2">
                </div>
            </div>
            `
            facepaintgroup.append(newelement);
            loadColorPalettes(facepaintgroup);

            if (resetcolor) {
                let firstcolor = facepaintgroup.find('.colorselect .palette input:radio').first();
                firstcolor.prop('checked', true);
                firstcolor.trigger('change');
            }
        }
        else {
            colors = facepaintgroup.find('.colorselect').remove();
        }
}

$(document).on('change', 'select.facepaintoverlay', function(evt) {
    let selected = $(this).find('option:selected');
    let id = selected.attr('class');
    let pairedId = null;
    let type = null;
    let prevtype = $(this).data('prev');
    if (id == 'makeup_1') {
        pairedId = 'makeup_2';
        type = 'makeup';
    }
    else if (id == 'blush_1') {
        pairedId = 'blush_2';
        type = 'blush';
    }

    if (prevtype != type) {
        $.post('https://cui_character/syncFacepaintOpacity', JSON.stringify({
            prevtype: prevtype,
            currenttype: type,
        }));

        let colorable = (prevtype == 'makeup');
        let group = $(this).parents().eq(2);
        setupFacepaintColors(group, colorable, true);
        $.post('https://cui_character/clearMakeup', JSON.stringify({
            clearopacity: false,
            clearblusher: true,
        }));
    }
    updateHeadOverlay(id, pairedId, selected.val(), selected.data('index'), false);
    $(this).data('prev', type)
});

$(document).on('input', 'input[type=range].facepaintoverlay', function(evt) {
    $(this).trigger('refresh');
    let selected = $(this).parents().eq(2).find('select').eq(0).find('option:selected');
    let pairedId = selected.attr('class');
    let id = null;
    let type = null;
    if (pairedId == 'makeup_1') {
        id = 'makeup_2';
        type = 'makeup';
    }
    else if (pairedId == 'blush_1') {
        id = 'blush_2';
        type = 'blush';
    }
    updateHeadOverlay(id, pairedId, $(this).val(), selected.data('index'), true);
    if (type == 'makeup') {
        $.post('https://cui_character/syncFacepaintOpacity', JSON.stringify({
            prevtype: 'makeup',
            currenttype: 'blush',
        }));
    }
    else if (type == 'blush') {
        $.post('https://cui_character/syncFacepaintOpacity', JSON.stringify({
            prevtype: 'blush',
            currenttype: 'makeup',
        }));
    }
});
////////////////////////////////////////////////////////

$(document).on('change', '.palette.haircolor input:radio', function(evt) {
    // NOTE: 'name' attribute value is taken from palette's id
    let highlight = $(this).attr('name') != 'hair_color_1' ? true : false;
    updateHairColor($(this).attr('name'), $(this).val(), highlight)
});

$(document).on('change', '.palette.overlaycolor input:radio', function(evt) {
    // NOTE: 'name' attribute value is taken from palette's id
    let palette = $(this).parents().eq(1)
    updateOverlayColor($(this).attr('name'), $(this).val(), palette.data('index'), palette.data('colortype'))
});

$(document).on('change', 'select.makeuptype', function(evt) {
    let value = $(this).find('option:selected').val();
    $.post('https://cui_character/clearMakeup', JSON.stringify({
        clearopacity: true,
        clearblusher: true,
    }));
    $.post('https://cui_character/updateMakeupType', JSON.stringify({type:value}));
});

// clothing components
$(document).on('change', 'select.clotheslist.component', function(evt) {
    let selected = $(this).find('option:selected');
    let drwkey = $(this).data('drwkey');
    let drwval = selected.data('drawable');
    let texkey = $(this).data('texkey');
    let texval = selected.data('texture');
    let cmpid = selected.data('component');
    updateApparelComponent(drwkey, drwval, texkey, texval, cmpid);
});

// clothing props
$(document).on('change', 'select.clotheslist.prop', function(evt) {
    let selected = $(this).find('option:selected');
    let drwkey = $(this).data('drwkey');
    let drwval = selected.data('drawable');
    let texkey = $(this).data('texkey');
    let texval = selected.data('texture');
    let propid = selected.data('prop');
    updateApparelProp(drwkey, drwval, texkey, texval, propid);
});

function refreshMakeupUI(charData, setDefaultMakeup) {
    let makeupcontrol = $(document).find('#makeup .list').first()
    let makeuppage = 'pages/optional/makeup_'
    let type = charData.makeup_type;

    switch (type) {
        // 'None'
        case 0:
            break;
        // 'Eye Makeup'
        case 1:
            makeuppage += 'eye.html'
            break;
        // 'Face Paint'
        case 2:
            makeuppage += 'facepaint.html'
            break;
        default:
            break;
    }

    // Remove all content
    makeupcontrol.nextAll('div').remove();

    $.get(makeuppage, function(data) {
        let makeupcontent = makeupcontrol.after(data).next()
        loadColorPalettes(makeupcontent);
        refreshContentData(makeupcontent, charData);

        if (setDefaultMakeup) {
            let makeupoption = null;
            if ((charData.makeup_type != 2) || 
                ((charData.makeup_1 == 255) && (charData.blush_1 == 255))) {
                makeupoption = makeupcontent.find('select option').first()
            }
            else {
                makeupoption = makeupcontent.find('select option[value="7"]')
            }
            if (makeupoption) {
                makeupoption.prop('selected', true)
                makeupoption.trigger('change')
            }
        }
    });
}

/*  interface and current character synchronization     */
function refreshComponentList(parent, id, component, drawable, texture) {
    let list = parent.find(id);
    list.find('option').each(function() {
        $(this).prop('selected', false);
    });
    list.find('option[data-component="' + component + '"][data-drawable="' + drawable + '"][data-texture="' + texture + '"]').first().prop('selected', true);
}

function refreshPropList(parent, id, prop, drawable, texture) {
    let list = parent.find(id);
    list.find('option').each(function() {
        $(this).prop('selected', false);
    });
    list.find('option[data-prop="' + prop + '"][data-drawable="' + drawable + '"][data-texture="' + texture + '"]').first().prop('selected', true);
}

function refreshContentData(element, data) {
    let facepaintcolorable = false;
    if (element.hasClass('facepaint')) {
        if (data.makeup_type == 2) {
            let facepaintcontrols = element.find('.facepaintoverlay');
            let facepainttype = 'makeup';
            if (data.makeup_1 == 255) {
                facepainttype = 'blush';
                facepaintcolorable = true;
            }
            facepaintcontrols.eq(0).data('prev', facepainttype);
            facepaintcontrols.eq(0).attr('id', facepainttype + '_1');
            facepaintcontrols.eq(1).attr('id', facepainttype + '_2');

            setupFacepaintColors(facepaintcontrols.eq(0).parents().eq(2), facepaintcolorable, false);
        }
    }

    /*
        Special loading path for clothing tab   
        Clothing data is not just simple key-value pairs.
    */
    if (element.is('#apparel')) {
        // components
        refreshComponentList(element, '#topover', 11, data.torso_1, data.torso_2);
        refreshComponentList(element, '#topunder', 8, data.tshirt_1, data.tshirt_2);
        refreshComponentList(element, '#pants', 4, data.pants_1, data.pants_2);
        refreshComponentList(element, '#shoes', 6, data.shoes_1, data.shoes_2);
        // refreshComponentList(element, '#bag', 5, data.bags_1, data.bags_2); NOTE: there seems to be no named components in this category, commenting it out
        refreshComponentList(element, '#neckarm', 7, data.neckarm_1, data.neckarm_2);

        // props
        refreshPropList(element, '#hat', 0, data.helmet_1, data.helmet_2);
        refreshPropList(element, '#ears', 2, data.ears_1, data.ears_2);
        refreshPropList(element, '#glasses', 1, data.glasses_1, data.glasses_2);
        refreshPropList(element, '#lefthand', 6, data.lefthand_1, data.lefthand_2);
        refreshPropList(element, '#righthand', 7, data.righthand_1, data.righthand_2);
    }
    else
    /*  Loading path for any other tab  */
    {
        for (const [key, value] of Object.entries(data)) {
            let keyId = '#' + key;
            let control = element.find(keyId);
            if (control.length) {
                let controltype = control.prop('nodeName');
                if (controltype == 'SELECT') { // arrow lists
                    if (!(control.hasClass('clotheslist'))) {
                        control.val(value);
                    }
                    else {
                        let i = 5;
                        let j = 6;
                    }
    
    
                    /* NOTE: For facepaint list we need an extra check since it has multiple
                             options with duplicated values.
    
                             This part of the code needs to be revised if Rockstar ever adds
                             more colorable facepaint variants.
                    */
                    if ((control.hasClass('facepaintoverlay') && facepaintcolorable)) {
                        if ((value >= 26) && (value < 33)) {
                            let duplicateoptions = control.find('option[value="' + value + '"]');
                            duplicateoptions.eq(0).prop('selected', false); // incorrect
                            duplicateoptions.eq(1).prop('selected', true);  // correct
                        }
                    }
                }
                else if (controltype == 'INPUT') { // range sliders
                    // NOTE: Check out property 'type' (ex. range) if this isn't unique enough
                    control.val(value)
                    control.trigger('refresh')
                }
                else if (controltype == 'DIV') { // radio button groups
                    let radio = control.find(':radio[value=' + value + ']');
                    radio.prop('checked', true);
                }
            }
        }
    }
}

/* TODO: Possibly add more sounds (mouseover?)
$('.panelbottom button').mouseenter(function(evt) {
    console.log('hovered')
    $.post('https://cui_character/playSound', JSON.stringify({sound:'mouseover'}));
});

$('.radioitem input:radio:not(:checked) + label').hover(function(evt) {
    console.log('hovered')
    $.post('https://cui_character/playSound', JSON.stringify({sound:'mouseover'}));
});
*/