package ru.mirea.project.repository;

import java.sql.*;
import java.util.*;
import ru.mirea.project.model.*;
import ru.mirea.project.util.DatabaseManager;

public final class JdbcRequestRepository implements RequestRepository {
  private final DatabaseManager db;

  public JdbcRequestRepository(DatabaseManager db) {
    this.db = db;
  }

  private EquipmentRequest map(ResultSet r) throws SQLException {
    return new EquipmentRequest(
        r.getLong("id"),
        r.getLong("user_id"),
        EquipmentType.valueOf(r.getString("equipment_type")),
        r.getInt("quantity"),
        r.getString("reason"),
        RequestStatus.valueOf(r.getString("status")),
        r.getTimestamp("created_at").toLocalDateTime());
  }

  public List<EquipmentRequest> findAll() {
    try (Connection c = db.getConnection();
        PreparedStatement s = c.prepareStatement("SELECT * FROM equipment_requests ORDER BY id");
        ResultSet r = s.executeQuery()) {
      List<EquipmentRequest> out = new ArrayList<>();
      while (r.next()) out.add(map(r));
      return out;
    } catch (SQLException e) {
      throw JdbcSupport.error(e);
    }
  }

  public Optional<EquipmentRequest> findById(long id) {
    try (Connection c = db.getConnection();
        PreparedStatement s = c.prepareStatement("SELECT * FROM equipment_requests WHERE id=?")) {
      s.setLong(1, id);
      try (ResultSet r = s.executeQuery()) {
        return r.next() ? Optional.of(map(r)) : Optional.empty();
      }
    } catch (SQLException e) {
      throw JdbcSupport.error(e);
    }
  }

  public EquipmentRequest create(EquipmentRequest q) {
    try (Connection c = db.getConnection();
        PreparedStatement s =
            c.prepareStatement(
                "INSERT INTO equipment_requests(user_id,equipment_type,quantity,reason,status)"
                    + " VALUES (?,?,?,?,'NEW') RETURNING *")) {
      bind(s, q);
      try (ResultSet r = s.executeQuery()) {
        r.next();
        return map(r);
      }
    } catch (SQLException e) {
      throw JdbcSupport.error(e);
    }
  }

  private void bind(PreparedStatement s, EquipmentRequest q) throws SQLException {
    s.setLong(1, q.getUserId());
    s.setString(2, q.getEquipmentType().name());
    s.setInt(3, q.getQuantity());
    s.setString(4, q.getReason());
  }

  public boolean update(EquipmentRequest q) {
    try (Connection c = db.getConnection();
        PreparedStatement s =
            c.prepareStatement(
                "UPDATE equipment_requests SET user_id=?,equipment_type=?,quantity=?,reason=? WHERE"
                    + " id=? AND status='NEW'")) {
      bind(s, q);
      s.setLong(5, q.getId());
      return s.executeUpdate() == 1;
    } catch (SQLException e) {
      throw JdbcSupport.error(e);
    }
  }

  public boolean changeStatus(long id, RequestStatus expected, RequestStatus next) {
    try (Connection c = db.getConnection();
        PreparedStatement s =
            c.prepareStatement("UPDATE equipment_requests SET status=? WHERE id=? AND status=?")) {
      s.setString(1, next.name());
      s.setLong(2, id);
      s.setString(3, expected.name());
      return s.executeUpdate() == 1;
    } catch (SQLException e) {
      throw JdbcSupport.error(e);
    }
  }

  public boolean delete(long id) {
    try (Connection c = db.getConnection();
        PreparedStatement s =
            c.prepareStatement(
                "DELETE FROM equipment_requests WHERE id=? AND status IN"
                    + " ('NEW','REJECTED','CANCELLED')")) {
      s.setLong(1, id);
      return s.executeUpdate() == 1;
    } catch (SQLException e) {
      throw JdbcSupport.error(e);
    }
  }
}
