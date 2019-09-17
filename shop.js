var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require("cli-table");
var connection;
var newPromise;
var done = false;
var database;
var shoppingCart = [];
var quantities = [];

read();

function addProductToCart(product, quantity) {
    shoppingCart.push(database[product]);
    quantities.push(quantity);
}

function checkout() {
    var total = 0;
    console.log("Your shopping cart:")
    var table = new Table({
        head: ['Product ID', 'Name', 'Department', 'Price'],
        colWidths: [15, 15, 15, 10]
    });
    shoppingCart.forEach((element) => {
        table.push([element.item_id, element.product_name, element.department_name, element.price, element.stock_quantity]);
        total = total + (parseFloat(element.price, 10));
    });

    console.log(table.toString());
    console.log(`Your total: $ ${total}`);
    connection.end();
};

function updateQuantities(item, qty) {

    var newQty = database[item].stock_quantity - qty;
    console.log(newQty);

    var query = connection.query(
        "UPDATE products SET ? WHERE ?",
        [{
                stock_quantity: newQty
            },
            {
                item_id: parseInt(item)
            }
        ],
        function (err, res) {
            if (err) throw err;
            console.log(res.affectedRows + " products updated!\n");
        }
    );

}

function buyProduct() {
    inquirer.prompt([{
            message: "Please choose a product you would like to buy?",
            name: "productID",
            type: "input"
        },
        {
            message: "How many units would you like to buy?",
            name: "quantity",
            type: "input",
        }
    ]).then(function (answer) {
        var qty = parseInt(answer.quantity, 10);
        var productID = answer.productID - 1;
        if (Number.isInteger(qty) && answer.productID <= database.length) {

            updateQuantities(productID, qty);
            addProductToCart(productID, qty);


            inquirer.prompt([{
                message: 'Add another product?',
                type: 'list',
                name: 'anotherProduct',
                choices: ['Yes', 'No']
            }]).then(function (choice) {
                if (choice.anotherProduct === 'Yes') {
                    buyProduct();
                } else {
                    checkout();
                }
            })
        } else {
            console.log("Your input was invalid! Please try again.")
            buyProduct();
        }
    });

};

function read() {

    connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "Helmar@123",
        database: "bamazon"
    })

    connection.connect(function (err) {
        if (err) throw err;
        newPromise.then(function (data) {
            console.log(data);
            buyProduct();
        });
    });

    newPromise = new Promise(function displayProducts(resolve, reject) {
        connection.query("SELECT * from products", function (err, res) {
            if (err) throw err;
            var table = new Table({
                head: ['Product ID', 'Name', 'Department', 'Price', 'Stock Quantity'],
                colWidths: [15, 15, 15, 10, 15]
            });
            res.forEach(function (element) {
                table.push([element.item_id, element.product_name, element.department_name, `$ ${element.price}`, element.stock_quantity]);
            })
            console.log(table.toString());
            database = res;
            done = true;
        })
        setTimeout(() => {
            if (done === true) {
                resolve("worked")
            } else {
                reject("did not work")
            }
        }, 1000);
    });
}



// Then create a Node application called bamazonCustomer.js. Running this application will first display all of the items available for sale. Include the ids, names, and prices of products for sale.
// The app should then prompt users with two messages.



// The first should ask them the ID of the product they would like to buy.
// The second message should ask how many units of the product they would like to buy.



// Once the customer has placed the order, your application should check if your store has enough of the product to meet the customer's request.



// If not, the app should log a phrase like Insufficient quantity!, and then prevent the order from going through.



// However, if your store does have enough of the product, you should fulfill the customer's order.


// This means updating the SQL database to reflect the remaining quantity.
// Once the update goes through, show the customer the total cost of their purchase.