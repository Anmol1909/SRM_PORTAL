<?php

declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/db.php';

$connection = db_connection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $result = $connection->query('SELECT * FROM invoices ORDER BY created_at DESC');
    $invoices = [];
    while ($row = $result->fetch_assoc()) {
        $row['amount'] = (float)$row['amount'];
        $invoices[] = $row;
    }
    echo json_encode([
        'success' => true,
        'invoices' => $invoices
    ]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $input = is_array($input) ? $input : [];

    $id = isset($input['id']) ? trim((string)$input['id']) : '';
    $po = isset($input['po']) ? trim((string)$input['po']) : '';
    $amount = isset($input['amount']) ? (float)$input['amount'] : 0.0;
    $submitted = isset($input['submitted']) ? trim((string)$input['submitted']) : '';
    $due = isset($input['due']) ? trim((string)$input['due']) : '';
    $status = isset($input['status']) ? trim((string)$input['status']) : 'Submitted';

    if ($id === '' || $po === '') {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'message' => 'Invoice ID and PO reference are required.'
        ]);
        exit;
    }

    $stmt = $connection->prepare('INSERT INTO invoices (id, po, amount, submitted, due, status) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE po=?, amount=?, submitted=?, due=?, status=?');
    $stmt->bind_param('ssdsssdsss', $id, $po, $amount, $submitted, $due, $status, $po, $amount, $submitted, $due, $status);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Invoice submitted successfully.'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save invoice: ' . $stmt->error
        ]);
    }
    $stmt->close();
    exit;
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? trim((string)$_GET['id']) : '';

    if ($id === '') {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'message' => 'Invoice ID is required.'
        ]);
        exit;
    }

    $stmt = $connection->prepare('DELETE FROM invoices WHERE id = ?');
    $stmt->bind_param('s', $id);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Invoice deleted successfully.'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to delete invoice.'
        ]);
    }
    $stmt->close();
    exit;
}

http_response_code(405);
echo json_encode([
    'success' => false,
    'message' => 'Method not allowed.'
]);
