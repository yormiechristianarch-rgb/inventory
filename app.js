import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ======================================================
// FIREBASE CONFIGURATION
// ======================================================


    const firebaseConfig = {
  apiKey: "AIzaSyCaHNE3Ixsj8LxsRzEFYhnN7sDh_zieFYQ",
  authDomain: "inventory-b9e1c.firebaseapp.com",
  projectId: "inventory-b9e1c",
  storageBucket: "inventory-b9e1c.firebasestorage.app",
  messagingSenderId: "139687395515",
  appId: "1:139687395515:web:8125022a791dd7794ae99e"
};


// Initialize Firebase

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);


// Products collection

const productsCollection = collection(db, "products");


// Local product array

let products = [];


// ======================================================
// NAVIGATION
// ======================================================

window.showSection = function(sectionName) {

    document.querySelectorAll(".section").forEach(section => {

        section.classList.remove("active");

    });


    document.getElementById(sectionName).classList.add("active");


    document.querySelectorAll(".nav-btn").forEach(button => {

        button.classList.remove("active");

    });


    const titles = {

        dashboard: "Dashboard",

        products: "Products",

        addProduct: "Add Product"

    };


    document.getElementById("pageTitle").textContent =
        titles[sectionName] || "Inventory";


    if (sectionName === "dashboard") {

        updateDashboard();

    }

};


// ======================================================
// ADD PRODUCT
// ======================================================

document
    .getElementById("productForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();


        const product = {

            name: document
                .getElementById("productName")
                .value
                .trim(),

            sku: document
                .getElementById("sku")
                .value
                .trim(),

            category: document
                .getElementById("category")
                .value
                .trim(),

            quantity: Number(
                document.getElementById("quantity").value
            ),

            buyingPrice: Number(
                document.getElementById("buyingPrice").value || 0
            ),

            sellingPrice: Number(
                document.getElementById("sellingPrice").value || 0
            ),

            supplier: document
                .getElementById("supplier")
                .value
                .trim(),

            lowStockLevel: Number(
                document.getElementById("lowStockLevel").value || 5
            ),

            createdAt: serverTimestamp(),

            updatedAt: serverTimestamp()

        };


        try {

            await addDoc(productsCollection, product);

            alert("Product added successfully!");

            resetForm();

            showSection("products");

        } catch (error) {

            console.error(error);

            alert(
                "Error adding product: " +
                error.message
            );

        }

    });


// ======================================================
// LOAD PRODUCTS FROM FIRESTORE
// ======================================================

onSnapshot(
    productsCollection,
    function(snapshot) {

        products = [];

        snapshot.forEach(function(documentSnapshot) {

            products.push({

                id: documentSnapshot.id,

                ...documentSnapshot.data()

            });

        });


        products.sort(function(a, b) {

            const dateA =
                a.createdAt?.seconds || 0;

            const dateB =
                b.createdAt?.seconds || 0;

            return dateB - dateA;

        });


        displayProducts();

        updateDashboard();

        updateCategoryFilter();

    },
    function(error) {

        console.error(error);

        alert(
            "Unable to load Firestore data: " +
            error.message
        );

    }
);


// ======================================================
// DISPLAY PRODUCTS
// ======================================================

function displayProducts(list = products) {

    const table =
        document.getElementById("productsTable");


    table.innerHTML = "";


    if (list.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center;padding:30px;">
                    No products found.
                </td>
            </tr>
        `;

        return;

    }


    list.forEach(function(product) {

        const status = getStockStatus(product);


        const row = document.createElement("tr");


        row.innerHTML = `

            <td>
                <div class="product-name">
                    ${escapeHtml(product.name)}
                </div>
            </td>

            <td>
                ${escapeHtml(product.sku || "-")}
            </td>

            <td>
                ${escapeHtml(product.category || "-")}
            </td>

            <td>
                ${product.quantity || 0}
            </td>

            <td>
                $${Number(product.buyingPrice || 0).toFixed(2)}
            </td>

            <td>
                $${Number(product.sellingPrice || 0).toFixed(2)}
            </td>

            <td>
                ${escapeHtml(product.supplier || "-")}
            </td>

            <td>
                <span class="status ${status.class}">
                    ${status.text}
                </span>
            </td>

            <td>

                <button
                    class="action-btn edit-btn"
                    onclick="editProduct('${product.id}')"
                >
                    Edit
                </button>

                <button
                    class="action-btn delete-btn"
                    onclick="deleteProduct('${product.id}')"
                >
                    Delete
                </button>

            </td>

        `;


        table.appendChild(row);

    });

}


// ======================================================
// STOCK STATUS
// ======================================================

function getStockStatus(product) {

    const quantity =
        Number(product.quantity || 0);

    const lowLevel =
        Number(product.lowStockLevel ?? 5);


    if (quantity <= 0) {

        return {

            text: "Out of Stock",

            class: "out"

        };

    }


    if (quantity <= lowLevel) {

        return {

            text: "Low Stock",

            class: "low"

        };

    }


    return {

        text: "In Stock",

        class: "good"

    };

}


// ======================================================
// EDIT PRODUCT
// ======================================================

window.editProduct = function(id) {

    const product =
        products.find(item => item.id === id);


    if (!product) {

        alert("Product not found.");

        return;

    }


    document.getElementById("editId").value =
        product.id;

    document.getElementById("editName").value =
        product.name || "";

    document.getElementById("editSku").value =
        product.sku || "";

    document.getElementById("editCategory").value =
        product.category || "";

    document.getElementById("editQuantity").value =
        product.quantity || 0;

    document.getElementById("editBuyingPrice").value =
        product.buyingPrice || 0;

    document.getElementById("editSellingPrice").value =
        product.sellingPrice || 0;

    document.getElementById("editSupplier").value =
        product.supplier || "";

    document.getElementById("editLowStockLevel").value =
        product.lowStockLevel ?? 5;


    document
        .getElementById("editModal")
        .classList.add("show");

};


// ======================================================
// UPDATE PRODUCT
// ======================================================

document
    .getElementById("editForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();


        const id =
            document.getElementById("editId").value;


        const updatedProduct = {

            name:
                document.getElementById("editName").value.trim(),

            sku:
                document.getElementById("editSku").value.trim(),

            category:
                document.getElementById("editCategory").value.trim(),

            quantity:
                Number(document.getElementById("editQuantity").value),

            buyingPrice:
                Number(
                    document.getElementById("editBuyingPrice").value || 0
                ),

            sellingPrice:
                Number(
                    document.getElementById("editSellingPrice").value || 0
                ),

            supplier:
                document.getElementById("editSupplier").value.trim(),

            lowStockLevel:
                Number(
                    document.getElementById("editLowStockLevel").value || 5
                ),

            updatedAt:
                serverTimestamp()

        };


        try {

            await updateDoc(
                doc(db, "products", id),
                updatedProduct
            );


            alert("Product updated successfully!");

            closeModal();

        } catch (error) {

            console.error(error);

            alert(
                "Error updating product: " +
                error.message
            );

        }

    });


// ======================================================
// DELETE PRODUCT
// ======================================================

window.deleteProduct = async function(id) {

    const product =
        products.find(item => item.id === id);


    if (!product) return;


    const confirmed = confirm(
        `Are you sure you want to delete "${product.name}"?`
    );


    if (!confirmed) return;


    try {

        await deleteDoc(
            doc(db, "products", id)
        );


        alert("Product deleted successfully!");

    } catch (error) {

        console.error(error);

        alert(
            "Error deleting product: " +
            error.message
        );

    }

};


// ======================================================
// CLOSE MODAL
// ======================================================

window.closeModal = function() {

    document
        .getElementById("editModal")
        .classList.remove("show");

};


// ======================================================
// RESET FORM
// ======================================================

window.resetForm = function() {

    document
        .getElementById("productForm")
        .reset();


    document.getElementById("lowStockLevel").value = 5;


    document.getElementById("productId").value = "";

};


// ======================================================
// SEARCH
// ======================================================

window.searchProducts = function() {

    const search =
        document
            .getElementById("searchInput")
            .value
            .toLowerCase()
            .trim();


    const category =
        document
            .getElementById("categoryFilter")
            .value;


    const filtered =
        products.filter(function(product) {

            const matchesSearch =

                (product.name || "")
                    .toLowerCase()
                    .includes(search)

                ||

                (product.sku || "")
                    .toLowerCase()
                    .includes(search)

                ||

                (product.supplier || "")
                    .toLowerCase()
                    .includes(search);


            const matchesCategory =

                !category ||
                product.category === category;


            return matchesSearch && matchesCategory;

        });


    displayProducts(filtered);

};


// ======================================================
// CATEGORY FILTER
// ======================================================

function updateCategoryFilter() {

    const select =
        document.getElementById("categoryFilter");


    const currentValue =
        select.value;


    const categories = [

        ...new Set(

            products
                .map(product => product.category)
                .filter(Boolean)

        )

    ].sort();


    select.innerHTML =
        `<option value="">All Categories</option>`;


    categories.forEach(function(category) {

        const option =
            document.createElement("option");


        option.value = category;

        option.textContent = category;


        select.appendChild(option);

    });


    select.value = currentValue;

}


// ======================================================
// DASHBOARD
// ======================================================

function updateDashboard() {

    const totalProducts =
        products.length;


    const totalStock =
        products.reduce(
            (total, product) =>
                total + Number(product.quantity || 0),
            0
        );


    const inventoryValue =
        products.reduce(
            (total, product) =>

                total +

                (
                    Number(product.quantity || 0) *
                    Number(product.buyingPrice || 0)
                ),

            0
        );


    const lowStockProducts =
        products.filter(function(product) {

            return Number(product.quantity || 0)
                <= Number(product.lowStockLevel ?? 5);

        });


    document.getElementById("totalProducts")
        .textContent = totalProducts;


    document.getElementById("totalStock")
        .textContent = totalStock;


    document.getElementById("inventoryValue")
        .textContent =
        "$" + inventoryValue.toFixed(2);


    document.getElementById("lowStock")
        .textContent =
        lowStockProducts.length;


    updateRecentProducts();

    updateStockAlerts();

}


// ======================================================
// RECENT PRODUCTS
// ======================================================

function updateRecentProducts() {

    const container =
        document.getElementById("recentProducts");


    container.innerHTML = "";


    const recent =
        products.slice(0, 5);


    if (recent.length === 0) {

        container.innerHTML = `

            <tr>
                <td colspan="4" style="text-align:center;">
                    No products yet.
                </td>
            </tr>

        `;

        return;

    }


    recent.forEach(function(product) {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                <strong>
                    ${escapeHtml(product.name)}
                </strong>
            </td>

            <td>
                ${escapeHtml(product.category || "-")}
            </td>

            <td>
                ${product.quantity || 0}
            </td>

            <td>
                $${Number(product.sellingPrice || 0).toFixed(2)}
            </td>

        `;


        container.appendChild(row);

    });

}


// ======================================================
// STOCK ALERTS
// ======================================================

function updateStockAlerts() {

    const container =
        document.getElementById("stockAlerts");


    container.innerHTML = "";


    const alerts =
        products.filter(function(product) {

            return Number(product.quantity || 0)
                <= Number(product.lowStockLevel ?? 5);

        });


    if (alerts.length === 0) {

        container.innerHTML = `

            <div class="alert">
                <strong>Everything looks good!</strong>
                <small>No low-stock products.</small>
            </div>

        `;

        return;

    }


    alerts.slice(0, 10).forEach(function(product) {

        const alert =
            document.createElement("div");


        alert.className = "alert";


        alert.innerHTML = `

            <strong>
                ${escapeHtml(product.name)}
            </strong>

            <small>
                Only ${product.quantity || 0}
                item(s) remaining.
            </small>

        `;


        container.appendChild(alert);

    });

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================================
// INITIAL PAGE
// ======================================================

showSection("dashboard");