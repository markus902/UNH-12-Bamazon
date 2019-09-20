var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require("cli-table");
var connection;
var database;
var shoppingCart = [];
var quantities = [];

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
    console.log(quantities[1]);
    for (i = 0; i < shoppingCart.length; i++) {
        table.push([shoppingCart[i].item_id, shoppingCart[i].product_name, shoppingCart[i].department_name, shoppingCart[i].price * quantities[i]]);
        total = total + parseFloat(shoppingCart[i].price, 10) * quantities[i];
    }

    console.log(table.toString());
    console.log(`Your total: $ ${total}`);
};

function updateQuantities(item, qty, method) {
    if (method) {
        var newQty = database[item].stock_quantity - qty;
    } else {
        var newQty = database[item].stock_quantity + qty;
    }
    var query = connection.query(
        "UPDATE products SET ? WHERE ?",
        [{
                stock_quantity: newQty
            },
            {
                item_id: parseInt(item + 1)
            }
        ],
        function (err, res) {
            if (err) throw err;
            // console.log(res.affectedRows + " products updated!\n");
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
            if (answer.quantity > database[answer.productID - 1].stock_quantity) {
                console.log("There is not enough stock for the amount you chose to buy. Please try again.")
                buyProduct();
            } else {
                updateQuantities(productID, qty, true);
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
                });
            }
        } else {
            console.log("Your input was invalid! Please try again.")
            buyProduct();
        }
    });
};

function addInventory(newItem) {
    if (newItem) {
        console.log('Enter the new product information:')
        inquirer.prompt([{
                message: 'Name?',
                name: 'name',
                type: 'input',
            }, {
                message: 'Department?',
                name: 'department',
                type: 'input',
            },
            {
                message: 'Price?',
                name: 'price',
                type: 'input',
            }, {
                message: 'Stock Quantity??',
                name: 'stock',
                type: 'input',
            }
        ]).then(function (choice) {
            var price = parseFloat(choice.price);
            var qty = parseInt(choice.stock);

            var query = connection.query('INSERT INTO products SET ?', {
                    product_name: choice.name,
                    department_name: choice.department,
                    price: price,
                    stock_quantity: qty
                },
                function (err, res) {
                    if (err) throw err;
                    console.log(res.affectedRows + " product inserted!\n");
                    manager();
                });
            console.log("New item added.")
        });
    } else {
        inquirer.prompt([{
            message: 'Which item would you like to add?',
            name: 'addItem',
            type: 'input',
        }, {
            message: 'How many units are added to the stock?',
            name: 'addQty',
            type: 'input',
        }]).then(function (choice) {
            var item = parseInt(choice.addItem);
            var qty = parseInt(choice.addQty);
            if (Number.isInteger(item) && Number.isInteger(qty)) {
                updateQuantities(item, qty, false);
            } else {
                console.log("Please use valid inputs. Try again!");
                addInventory(false);
            }
        });
    }
}

function manager() {
    var table = new Table({
        head: ['Product ID', 'Name', 'Department', 'Price', 'Stock Quantity'],
        colWidths: [15, 15, 15, 10, 15]
    });
    console.log("Report of low inventory levels:")
    database.forEach(element => {
        if (element.stock_quantity < 5) {
            table.push([element.item_id, element.product_name, element.department_name, element.price, element.stock_quantity]);
        }
    });
    console.log(table.toString())

    inquirer.prompt([{
        message: 'Add inventory?',
        name: 'addInventory',
        type: 'list',
        choices: ['yes, add stock to existing', 'yes, create new item', 'no']
    }]).then(function (choice) {
        if (choice.addInventory === 'yes, add stock to existing') {
            addInventory(false);
        } else if (choice.addInventory === 'yes, create new item') {
            addInventory(true);
        } else {
            read();
        }
    });
}


function read() {

    connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "Helmar@123",
        database: "bamazon"
    })
    connection.connect(function (err) {
        if (err) throw err;
    });
    connection.query("SELECT * from products", function (err, res) {
        if (err) throw err;
        var table = new Table({
            head: ['Product ID', 'Name', 'Department', 'Price', 'Stock Quantity'],
            colWidths: [15, 15, 15, 10, 15]
        });
        res.forEach(function (element) {
            table.push([element.item_id, element.product_name, element.department_name, `$ ${element.price}`, element.stock_quantity]);
        });
        console.log(table.toString());
        database = res;
        inquirer.prompt([{
            message: 'Who are you?',
            name: 'manager',
            type: 'list',
            choices: ['Manager', 'Customer']
        }]).then(function (choice) {
            if (choice.manager === 'Manager') {
                manager();
            } else {
                buyProduct();
            }
        });
    });
};

read();


// Create a new Node application called bamazonManager.js. Running this application will:


// List a set of menu options:
// View Products for Sale
// View Low Inventory
// Add to Inventory
// Add New Product
// If a manager selects View Products for Sale, the app should list every available item: the item IDs, names, prices, and quantities.
// If a manager selects View Low Inventory, then it should list all items with an inventory count lower than five.
// If a manager selects Add to Inventory, your app should display a prompt that will let the manager "add more" of any item currently in the store.
// If a manager selects Add New Product, it should allow the manager to add a completely new product to the store.