let tg = window.Telegram.WebApp;
product_list = []
$(window).on('scroll', handleScroll);
$(document).ready(function() {
    $(".minus").on("click", function() {
        var input = $(this).siblings("input");
        var currentValue = parseInt(input.val(), 10);
        if (currentValue > 1) {
        input.val(currentValue - 1);
        }
    });

    $(".plus").on("click", function() {
        var input = $(this).siblings("input");
        var currentValue = parseInt(input.val(), 10);
        input.val(currentValue + 1);
    });

    $('.categories li').on('click', function() {
        var targetId = $(this).data('target');
        
        $('html, body').animate({
            scrollTop: $('#' + targetId).offset().top - 120
        }, 500);
    });

    $('li button').on('click', function() {
        var listItem = $(this).closest('li');
        
        var productName = listItem.find('p').text();
        var quantity = parseInt(listItem.find('input').val());
        var price = parseFloat(listItem.find('button').text().replace(' тг.', ''));
    
        var total = quantity * price;

        var product = {
            name: productName,
            quantity: quantity,
            total: total
        };
    
        product_list.push(product);
    
        $('.accept_buying').text('Корзина (' + product_list.length + ')')
        checkList()

    });
    $('#overlay').on('click', function() {
        overlay()
    });
});

function overlay() {
    $('#overlay').css('display', 'none');
    $('.product-list').css('display', 'none');
    $('body').removeClass('no-scroll');
    $('.communication').css('display', 'none');
    $('.message-box').css('display', 'none');
}

function checkList() {
    if (product_list.length > 0) {
        $('.accept_buying').css('display', 'block');
        $('.reset_products').css('display', 'block');
    }
    else {
        $('.accept_buying').css('display', 'none');
        $('.reset_products').css('display', 'none');
    }
}

function removeProducts() {
    product_list = []
    checkList()
}

function acceptBuying() {
    purchaseAmount = 0
    $('#overlay').css('display', 'block');
    $('.products').empty();
    for (var i = 0; i < product_list.length; i++) {
        var product = product_list[i];
        var productInfo = product.name + ' - ' + product.quantity + ' шт. - ' + product.total + ' тг.';
        purchaseAmount += product.total
        $('.products').append('<div class="product-item"><span>' + productInfo + '</span>' + '<button class="remove-product" data-index="' + i + '"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M6 5H18M9 5V5C10.5769 3.16026 13.4231 3.16026 15 5V5M9 20H15C16.1046 20 17 19.1046 17 18V9C17 8.44772 16.5523 8 16 8H8C7.44772 8 7 8.44772 7 9V18C7 19.1046 7.89543 20 9 20Z" stroke="#ff7070" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg></button></div>');
    }
    $('.product-list').append('<p class="totalSum">' + "Сумма заказа: " + purchaseAmount + ' тг.' + '</p>');
    $('.product-list').css('display', 'block');
    $('body').addClass('no-scroll');

    $('.remove-product').on('click', function() {
        var indexToRemove = $(this).data('index');
        removeProduct(indexToRemove);
    });
}

function removeProduct(index) {
    product_list.splice(index, 1);
    checkList();
    acceptBuying();
    $('.accept_buying').text('Корзина (' + product_list.length + ')')
    if (product_list.length === 0) {
        overlay()
    }
}

function handleScroll() {
    var scrollPosition = $(window).scrollTop();
    if (scrollPosition >= $('#folders').offset().top - 200) {
        $('.categories li').removeClass('selected');
        $('#hfolders').addClass('selected');
        
    }
    else if (scrollPosition >= $('#linear').offset().top -200) {
        $('.categories li').removeClass('selected');
        $('#hlinear').addClass('selected');
    }
    else {
        $('.categories li').removeClass('selected');
        $('#hpen').addClass('selected');
    }

}

function sendData() {
    $('.product-list').css('display', 'none');
    $('.communication').css('display', 'flex');
    $('#name').val(tg.initDataUnsafe.user.first_name + ' ' + tg.initDataUnsafe.user.last_name)
}

const tg_bot_token = 'token'
const tg_chat_id = 'chatid'
const api = 'https://api.telegram.org/bot'+tg_bot_token+'/sendMessage'

async function finishOrder(event) {
    if ($('#name').val().trim() != '' && $('#number').val().trim() != '') {
        if ($('#number').val().length < 10 || $('#number').val().length > 11) {
            $('.message-error').text('Введите корректный номер телефона!')
            event.preventDefault();
            return false;
        }
        else {
            event.preventDefault()

            const form = event.target
            const formData = new FormData(form)
            const formDataObject = Object.fromEntries(formData.entries())
    
            let text = 'Заявка от ' + formDataObject.name + '(ID: ' + tg.initDataUnsafe.user.id + ')' + '\n' + 'Номер: ' + formDataObject.number + '\n' + '------\n' + 'Список товаров:\n'
    
            for(i = 0; i < product_list.length; i++) {
                product = product_list[i]
                text += product.name + ' - ' + product.quantity + ' шт.' + ' - ' + product.total + ' тг.\n'
            }
            text += '------\n' + 'Общая сумма: ' + purchaseAmount + ' тг.'
    
            try {
                let response = await fetch(api, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        chat_id: tg_chat_id,
                        text,
                    })
                });
    
                if (response.ok) {
                    $('#name').val('')
                    $('#number').val('')
                    $('.message-error').text('')
                    $('.message-box').css('display', 'flex');
                    $('.message-box').text('Ваш заказ на сумму ' + purchaseAmount + ' тг. ' + ' принят на обработку.')
                    product_list = []
                    $('.communication').css('display', 'none');
                    checkList()
                }
                else {
                    throw new Error(response.statusText)
                }
            } catch (error) {
                console.error(error)
            }
        }
    }
    else {
        $('.message-error').text('Заполните все поля!')
        event.preventDefault();
        return false;
    }
       
}