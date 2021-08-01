<?php
$source = file("vaccinations.source.txt");

$file = "";
foreach($source as $line) {
    $file = $file.$line.",\n\r";
}

file_put_contents("vacc.txt", $file);

?>