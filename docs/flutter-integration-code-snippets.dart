// Add this to your Flutter app to show test card information
class TestCardInfoDialog extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Test Card Information'),
      content: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Use these details for testing:', style: TextStyle(fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text('Card Number: 5399 8383 8383 8381'),
            Text('Expiry Date: Any future date (e.g., 10/25)'),
            Text('CVV: Any 3 digits (e.g., 123)'),
            Text('PIN: Any 4 digits (e.g., 1234)'),
            Text('OTP: 123456'),
            SizedBox(height: 16),
            Text('For failed payment test:', style: TextStyle(fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text('Card Number: 5399 8383 8383 8399'),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text('Close'),
        ),
      ],
    );
  }
}

// Add a button to show the test card info
ElevatedButton(
  onPressed: () {
    showDialog(
      context: context,
      builder: (context) => TestCardInfoDialog(),
    );
  },
  style: ElevatedButton.styleFrom(
    primary: Colors.grey[200],
    onPrimary: Colors.black87,
  ),
  child: Text('Show Test Card Info'),
), 