<?php
// Simple PHP API to serve jobs from PostgreSQL database
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Database connection
$host = 'localhost';
$port = '5432';
$dbname = 'openrole';
$user = 'postgres';
$password = 'postgres';

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$dbname", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get parameters
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    $location = isset($_GET['location']) ? $_GET['location'] : '';
    $experience = isset($_GET['experience']) ? $_GET['experience'] : '';
    
    // Build query
    $whereConditions = ["j.status = 'active'"];
    $params = [];
    
    if (!empty($search)) {
        $whereConditions[] = "(j.title ILIKE :search OR c.name ILIKE :search)";
        $params['search'] = "%$search%";
    }
    
    if (!empty($location)) {
        $whereConditions[] = "j.location_general ILIKE :location";
        $params['location'] = "%$location%";
    }
    
    if (!empty($experience)) {
        $whereConditions[] = "j.experience_level = :experience";
        $params['experience'] = $experience;
    }
    
    $whereClause = implode(' AND ', $whereConditions);
    
    // Count total jobs
    $countQuery = "SELECT COUNT(*) as total FROM jobs j JOIN companies c ON j.company_id = c.id WHERE $whereClause";
    $countStmt = $pdo->prepare($countQuery);
    $countStmt->execute($params);
    $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get jobs
    $query = "
        SELECT 
            j.id,
            j.title,
            j.description,
            c.name as company_name,
            j.salary_min,
            j.salary_max,
            j.salary_currency,
            j.location_precise,
            j.location_general,
            j.remote_type,
            j.employment_type,
            j.experience_level,
            j.core_skills,
            j.nice_to_have_skills,
            j.created_at,
            j.expires_at
        FROM jobs j 
        JOIN companies c ON j.company_id = c.id 
        WHERE $whereClause
        ORDER BY j.created_at DESC 
        LIMIT :limit OFFSET :offset
    ";
    
    $params['limit'] = $limit;
    $params['offset'] = $offset;
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format response
    $response = [
        'success' => true,
        'data' => [
            'jobs' => $jobs,
            'pagination' => [
                'total' => (int)$total,
                'limit' => $limit,
                'offset' => $offset,
                'pages' => ceil($total / $limit),
                'current_page' => floor($offset / $limit) + 1
            ]
        ]
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>