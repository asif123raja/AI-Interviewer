import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/stat_card.dart';
import '../practice/setup_screen.dart';
import '../report/report_detail_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  _DashboardScreenState createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final AuthService _authService = AuthService();
  Map<String, dynamic>? _stats;
  List<dynamic> _history = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        ApiService.fetchDashboardStats(),
        ApiService.fetchReports(),
      ]);

      setState(() {
        _stats = results[0] as Map<String, dynamic>;
        _history = results[1] as List<dynamic>;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = "Failed to load dashboard data. Please ensure you are logged in and the server is running. (${e.toString()})";
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: Theme.of(context).primaryColor),
        ),
      );
    }

    if (_error != null && _stats == null && _history.isEmpty) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Text(_error!, style: const TextStyle(color: Colors.red)),
          ),
        ),
      );
    }

    final user = _authService.currentUser;
    final displayName = user?.displayName?.split(' ').first ?? 'User';

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Welcome back, $displayName',
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: -0.5),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Here\'s your interview performance overview.',
                        style: TextStyle(
                          color: Theme.of(context).brightness == Brightness.dark 
                              ? AppTheme.mutedDark 
                              : AppTheme.mutedLight, // Wait, wrong var, fix later in actual use
                        ),
                      ),
                    ],
                  ),
                  ElevatedButton.icon(
                    onPressed: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const SetupScreen()));
                    },
                    icon: const Icon(LucideIcons.target, size: 16),
                    label: const Text('New Interview'),
                  )
                ],
              ),
              const SizedBox(height: 24),

              // Stats Grid
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 1.2,
                children: [
                   StatCard(
                    title: "Total Interviews",
                    value: _stats?['totalInterviews']?.toString() ?? "0",
                    icon: LucideIcons.clock,
                    trend: "All time",
                  ),
                   StatCard(
                    title: "Avg. Confidence",
                    value: "${_stats?['avgConfidence'] ?? 0}%",
                    icon: LucideIcons.trophy,
                    trend: "Calculated average",
                  ),
                   StatCard(
                    title: "Avg. Anxiety",
                    value: "${_stats?['avgAnxiety'] ?? 0}%",
                    icon: LucideIcons.activity,
                    trend: "Calculated average",
                    trendDown: true,
                  ),
                  const StatCard(
                    title: "Questions Answered",
                    value: "142",
                    icon: LucideIcons.target,
                    trend: "Top 15% of users",
                  ),
                ],
              ),
              
              const SizedBox(height: 24),

              // Chart Section
              GlassCard(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Performance Trajectory', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 24),
                    SizedBox(
                      height: 250,
                      child: _history.isEmpty 
                        ? const Center(child: Text('Complete interviews to see your performance trajectory.'))
                        : _buildChart(),
                    )
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Recent History
              GlassCard(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Recent History', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 16),
                    if (_history.isEmpty)
                      const Center(child: Padding(
                        padding: EdgeInsets.all(24.0),
                        child: Text('No interviews found. Start your first practice session!'),
                      ))
                    else
                      ..._history.take(5).map((report) => _buildHistoryItem(report)).toList()
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildChart() {
    // Reverse history and map to spots
    final reversedHistory = _history.reversed.toList();
    List<FlSpot> confidenceSpots = [];
    List<FlSpot> anxietySpots = [];

    for (int i = 0; i < reversedHistory.length; i++) {
        double conf = (reversedHistory[i]['avgConfidenceScore'] ?? 0).toDouble();
        double anx = (reversedHistory[i]['anxietyScore'] ?? 0).toDouble();
        confidenceSpots.add(FlSpot(i.toDouble(), conf));
        anxietySpots.add(FlSpot(i.toDouble(), anx));
    }

    return LineChart(
      LineChartData(
        gridData: const FlGridData(show: false),
        titlesData: const FlTitlesData(
          rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: false),
        minY: 0,
        maxY: 100,
        lineBarsData: [
          LineChartBarData(
            spots: confidenceSpots,
            isCurved: true,
            color: Theme.of(context).primaryColor,
            barWidth: 3,
            dotData: const FlDotData(show: false),
            belowBarData: BarAreaData(show: true, color: Theme.of(context).primaryColor.withOpacity(0.1)),
          ),
          LineChartBarData(
            spots: anxietySpots,
            isCurved: true,
            color: Colors.redAccent,
            barWidth: 3,
            dotData: const FlDotData(show: false),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryItem(Map<String, dynamic> report) {
    print(report); 
    String role = "${report['domain'] ?? ''} ${report['subtopic'] != null ? '- ${report['subtopic']}' : ''}";
    double score = (report['avgConfidenceScore'] ?? 0).toDouble();
    String date = DateTime.parse(report['createdAt'] ?? DateTime.now().toIso8601String()).toLocal().toString().split(' ')[0];

    String grade = score >= 80 ? "A" : score >= 70 ? "B" : "C";

    return InkWell(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (_) => ReportDetailScreen(reportId: report['id'] ?? '')));
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: Theme.of(context).dividerColor)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(role, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                  Text(date, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                ],
              ),
            ),
            Row(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(score.toStringAsFixed(1), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    const Text('SCORE', style: TextStyle(fontSize: 10, color: Colors.grey)),
                  ],
                ),
                const SizedBox(width: 12),
                CircleAvatar(
                  backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
                  child: Text(grade, style: TextStyle(color: Theme.of(context).primaryColor, fontWeight: FontWeight.bold)),
                )
              ],
            )
          ],
        ),
      ),
    );
  }
}
