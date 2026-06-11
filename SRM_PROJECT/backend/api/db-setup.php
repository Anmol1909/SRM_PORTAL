<?php
declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/db.php';
$connection = db_connection();

$log = [];

// 1. Create rfq_items table first (so foreign keys can reference it)
$createRfqItems = "
CREATE TABLE IF NOT EXISTS rfq_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rfq_id VARCHAR(50) NOT NULL,
  item_name VARCHAR(150) NOT NULL,
  specification TEXT DEFAULT NULL,
  quantity INT NOT NULL,
  unit VARCHAR(50) NOT NULL,
  FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

if ($connection->query($createRfqItems)) {
    $log[] = "Table 'rfq_items' verified/created successfully.";
} else {
    $log[] = "Error creating table 'rfq_items': " . $connection->error;
}

// 2. Seed RFQ Items
$seedRfqItems = "
INSERT INTO rfq_items (id, rfq_id, item_name, specification, quantity, unit)
VALUES
  (1, 'RFQ-24061', 'Steel Bearings SB-100', 'Grade A Double Sealed, Heavy Duty', 1000, 'pcs'),
  (2, 'RFQ-24061', 'Brass Bushings BB-50', 'Heavy duty self-lubricating sleeve', 500, 'pcs'),
  (3, 'RFQ-24062', 'Heavy Duty Steel Racks', '4-Tier Industrial Shelving units', 20, 'units'),
  (4, 'RFQ-24063', 'Silicon Wafers 300mm', 'Ultra-pure Prime grade 100-type', 150, 'units')
ON DUPLICATE KEY UPDATE id = VALUES(id);
";

if ($connection->query($seedRfqItems)) {
    $log[] = "Seeded initial 'rfq_items' successfully.";
} else {
    $log[] = "Warning seeding 'rfq_items': " . $connection->error;
}

// 3. Create supplier_quotes table
$createSupplierQuotes = "
CREATE TABLE IF NOT EXISTS supplier_quotes (
  id VARCHAR(50) PRIMARY KEY,
  rfq_id VARCHAR(50) NOT NULL,
  supplier_id INT UNSIGNED NOT NULL,
  supplier_name VARCHAR(120) DEFAULT NULL,
  subtotal DECIMAL(15, 2) NOT NULL,
  tax_total DECIMAL(15, 2) NOT NULL,
  freight DECIMAL(15, 2) NOT NULL,
  grand_total DECIMAL(15, 2) NOT NULL,
  delivery VARCHAR(100) DEFAULT NULL,
  warranty VARCHAR(100) DEFAULT NULL,
  score INT UNSIGNED DEFAULT 85,
  best INT DEFAULT 0,
  status ENUM('submitted', 'under_review', 'awarded', 'rejected', 'under_negotiation', 'countered', 'finalized') DEFAULT 'submitted',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

if ($connection->query($createSupplierQuotes)) {
    $log[] = "Table 'supplier_quotes' verified/created successfully.";
} else {
    $log[] = "Error creating table 'supplier_quotes': " . $connection->error;
}

// 4. Create supplier_quote_items table
$createSupplierQuoteItems = "
CREATE TABLE IF NOT EXISTS supplier_quote_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_quote_id VARCHAR(50) NOT NULL,
  rfq_item_id INT NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  quantity INT NOT NULL,
  tax_percent DECIMAL(5, 2) DEFAULT 0.00,
  line_total DECIMAL(15, 2) NOT NULL,
  remarks TEXT DEFAULT NULL,
  FOREIGN KEY (supplier_quote_id) REFERENCES supplier_quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (rfq_item_id) REFERENCES rfq_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

if ($connection->query($createSupplierQuoteItems)) {
    $log[] = "Table 'supplier_quote_items' verified/created successfully.";
} else {
    $log[] = "Error creating table 'supplier_quote_items': " . $connection->error;
}

// 5. Create supplier_quote_documents table
$createSupplierQuoteDocs = "
CREATE TABLE IF NOT EXISTS supplier_quote_documents (
  document_id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_quote_id VARCHAR(50) NOT NULL,
  supplier_id INT UNSIGNED NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  stored_file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT DEFAULT NULL,
  mime_type VARCHAR(100) DEFAULT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_quote_id) REFERENCES supplier_quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

if ($connection->query($createSupplierQuoteDocs)) {
    $log[] = "Table 'supplier_quote_documents' verified/created successfully.";
} else {
    $log[] = "Error creating table 'supplier_quote_documents': " . $connection->error;
}

// 6. Create negotiations table
$createNegotiations = "
CREATE TABLE IF NOT EXISTS negotiations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    bid_id VARCHAR(50) NOT NULL,
    round_number INT UNSIGNED NOT NULL DEFAULT 1,
    initiated_by INT UNSIGNED NOT NULL,
    offered_price DECIMAL(15,2) NOT NULL,
    message TEXT DEFAULT NULL,
    status ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bid_id) REFERENCES supplier_quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (initiated_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

if ($connection->query($createNegotiations)) {
    $log[] = "Table 'negotiations' verified/created successfully.";
} else {
    $log[] = "Error creating table 'negotiations': " . $connection->error;
}

// 7. Create bid_messages table
$createBidMessages = "
CREATE TABLE IF NOT EXISTS bid_messages (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    bid_id VARCHAR(50) NOT NULL,
    sender_id INT UNSIGNED NOT NULL,
    message TEXT NOT NULL,
    message_type ENUM('message', 'counter_offer', 'acceptance', 'rejection', 'system') NOT NULL DEFAULT 'message',
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bid_id) REFERENCES supplier_quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

if ($connection->query($createBidMessages)) {
    $log[] = "Table 'bid_messages' verified/created successfully.";
} else {
    $log[] = "Error creating table 'bid_messages': " . $connection->error;
}

// 8. Seed Supplier Quotes
$seedQuotes = "
INSERT INTO supplier_quotes (id, rfq_id, supplier_id, supplier_name, subtotal, tax_total, freight, grand_total, delivery, warranty, score, best)
VALUES
  ('BID-1', 'RFQ-24061', 2, 'Apex Industrial Components', 97000.00, 17460.00, 540.00, 115000.00, '10 Days', '3 Years', 92, 1),
  ('BID-2', 'RFQ-24061', 2, 'Apex Industrial Components', 105000.00, 18900.00, 1100.00, 125000.00, '15 Days', '2 Years', 88, 0),
  ('BID-3', 'RFQ-24061', 2, 'Apex Industrial Components', 92500.00, 16650.00, 850.00, 110000.00, '20 Days', '1 Year', 81, 0)
ON DUPLICATE KEY UPDATE id = VALUES(id);
";

if ($connection->query($seedQuotes)) {
    $log[] = "Seeded initial 'supplier_quotes' successfully.";
} else {
    $log[] = "Warning seeding 'supplier_quotes': " . $connection->error;
}

// 9. Seed Supplier Quote Items
$seedQuoteItems = "
INSERT INTO supplier_quote_items (id, supplier_quote_id, rfq_item_id, unit_price, quantity, tax_percent, line_total, remarks)
VALUES
  (1, 'BID-1', 1, 75.00, 1000, 18.00, 88500.00, 'Standard grade'),
  (2, 'BID-1', 2, 44.00, 500, 18.00, 25960.00, 'Premium bushing'),
  (3, 'BID-2', 1, 80.00, 1000, 18.00, 94400.00, 'Reinforced seal'),
  (4, 'BID-2', 2, 50.00, 500, 18.00, 29500.00, 'Custom finish'),
  (5, 'BID-3', 1, 70.00, 1000, 18.00, 82600.00, 'Budget bearings'),
  (6, 'BID-3', 2, 45.00, 500, 18.00, 26550.00, 'Standard bushing')
ON DUPLICATE KEY UPDATE id = VALUES(id);
";

if ($connection->query($seedQuoteItems)) {
    $log[] = "Seeded initial 'supplier_quote_items' successfully.";
} else {
    $log[] = "Warning seeding 'supplier_quote_items': " . $connection->error;
}

// 10. Update bids table status column ENUM if needed
$checkBidsStatus = $connection->query("SHOW COLUMNS FROM bids LIKE 'status'");
if ($checkBidsStatus && $checkBidsStatus->num_rows > 0) {
    $modifyBidsStatus = "
    ALTER TABLE bids MODIFY COLUMN status ENUM(
        'submitted', 'under_review', 'awarded', 'rejected', 'under_negotiation', 'countered', 'finalized'
    ) DEFAULT 'submitted';
    ";
    if ($connection->query($modifyBidsStatus)) {
        $log[] = "Updated 'bids' table status column enum options successfully.";
    } else {
        $log[] = "Warning modifying 'bids' status enum: " . $connection->error;
    }
}

echo json_encode([
    'success' => true,
    'message' => 'Database tables checked and verified.',
    'log' => $log
]);
