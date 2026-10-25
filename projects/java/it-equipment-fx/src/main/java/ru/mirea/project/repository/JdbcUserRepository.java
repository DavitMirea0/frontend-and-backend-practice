package ru.mirea.project.repository;

import java.sql.*;

import java.util.*;

import ru.mirea.project.model.User;

import ru.mirea.project.util.DatabaseManager;

public final class JdbcUserRepository implements UserRepository {

  
  private final DatabaseManager db;

  public JdbcUserRepository(DatabaseManager db) {

    
    this.db = db;
  }

  private User map(ResultSet r) throws SQLException {

    return new User(

        r.getLong("id"), r.getString("full_name"), r.getString("email"), r.getString("department"));
  }

  public List<User> findAll() {

    
    try (Connection c = db.getConnection();

        
        PreparedStatement s = c.prepareStatement("SELECT * FROM users ORDER BY id");

        ResultSet r = s.executeQuery()) {

      List<User> out = new ArrayList<>();

      while (r.next()) out.add(map(r));

      return out;

    } catch (SQLException e) {

      throw JdbcSupport.error(e);
    }
  }

  public Optional<User> findById(long id) {

    
    try (Connection c = db.getConnection();

        
        PreparedStatement s = c.prepareStatement("SELECT * FROM users WHERE id=?")) {

      
      s.setLong(1, id);

      try (ResultSet r = s.executeQuery()) {

        return r.next() ? Optional.of(map(r)) : Optional.empty();
      }

    } catch (SQLException e) {

      throw JdbcSupport.error(e);
    }
  }

  public User create(User u) {

    
    try (Connection c = db.getConnection();

        
        PreparedStatement s =

            
            c.prepareStatement(

                
                "INSERT INTO users(full_name,email,department) VALUES (?,?,?) RETURNING *")) {

      bind(s, u);

      try (ResultSet r = s.executeQuery()) {

        r.next();

        return map(r);
      }

    } catch (SQLException e) {

      throw JdbcSupport.error(e);
    }
  }

  private void bind(PreparedStatement s, User u) throws SQLException {

    
    s.setString(1, u.getFullName());

    
    s.setString(2, u.getEmail());

    
    s.setString(3, u.getDepartment());
  }

  public boolean update(User u) {

    
    try (Connection c = db.getConnection();

        
        PreparedStatement s =

            
            c.prepareStatement("UPDATE users SET full_name=?,email=?,department=? WHERE id=?")) {

      bind(s, u);

      
      s.setLong(4, u.getId());

      
      return s.executeUpdate() == 1;

    } catch (SQLException e) {

      throw JdbcSupport.error(e);
    }
  }

  public boolean delete(long id) {

    
    try (Connection c = db.getConnection();

        
        PreparedStatement s = c.prepareStatement("DELETE FROM users WHERE id=?")) {

      
      s.setLong(1, id);

      
      return s.executeUpdate() == 1;

    } catch (SQLException e) {

      throw JdbcSupport.error(e);
    }
  }
}
