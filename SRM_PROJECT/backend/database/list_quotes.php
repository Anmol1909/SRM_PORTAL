<?php
require_once __DIR__ . '/../config/db.php';
$connection = db_connection();

$result = $connection->query("SELECT id, rfq_id, supplier_name, grand_total, status FROM supplier_quotes");
if ($result) {
    echo "Rows in supplier_quotes:\n";
    while ($row = $result->fetch_assoc()) {
        echo "- ID: " . $row['id'] . ", RFQ: " . $row['rfq_id'] . ", Supplier: " . $row['supplier_name'] . ", Total: " . $row['grand_total'] . ", Status: " . $row['status'] . "\n";
    }
} else {
    echo "Error querying supplier_quotes: " . $connection->error . "\n";
}
